import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository, EntityManager } from '@mikro-orm/postgresql';
import { Scan } from '../../entities/scan.entity';

interface ScanProgressData {
  scanId: number;
  progress: number;
  message: string;
  data?: any;
  timestamp: string;
}

interface ScanCompletedData {
  scanId: number;
  result: any;
  timestamp: string;
}

interface ScanFailedData {
  scanId: number;
  error: string;
  timestamp: string;
}

@WebSocketGateway({
  cors: {
    origin: '*', // 프로덕션에서는 특정 도메인으로 제한
    credentials: true,
  },
  namespace: 'scans',
})
export class ScanGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ScanGateway.name);

  constructor(
    @InjectRepository(Scan)
    private readonly scanRepository: EntityRepository<Scan>,
    private readonly em: EntityManager,
  ) {}

  /**
   * 클라이언트 연결 시
   */
  handleConnection(client: Socket) {
    this.logger.log(`[WS_CONNECT] Client connected: ${client.id}`);
  }

  /**
   * 클라이언트 연결 해제 시
   */
  handleDisconnect(client: Socket) {
    this.logger.log(`[WS_DISCONNECT] Client disconnected: ${client.id}`);
  }

  /**
   * 클라이언트가 특정 스캔 구독
   * @example socket.emit('subscribe-scan', 123)
   */
  @SubscribeMessage('subscribe-scan')
  handleSubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() scanId: number,
  ) {
    const room = `scan-${scanId}`;
    client.join(room);
    this.logger.log(
      `[WS_SUBSCRIBE] Client ${client.id} subscribed to scan ${scanId}`,
    );

    return {
      event: 'subscribed',
      data: { scanId, message: `Subscribed to scan ${scanId}` },
    };
  }

  /**
   * 클라이언트가 스캔 구독 해제
   * @example socket.emit('unsubscribe-scan', 123)
   */
  @SubscribeMessage('unsubscribe-scan')
  handleUnsubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() scanId: number,
  ) {
    const room = `scan-${scanId}`;
    client.leave(room);
    this.logger.log(
      `[WS_UNSUBSCRIBE] Client ${client.id} unsubscribed from scan ${scanId}`,
    );

    return {
      event: 'unsubscribed',
      data: { scanId, message: `Unsubscribed from scan ${scanId}` },
    };
  }

  /**
   * 스캔 진행 상황 브로드캐스트
   * Room에 속한 모든 클라이언트에게 전송
   */
  async sendProgress(
    scanId: number,
    progress: number,
    message: string,
    data?: any,
    skipDbUpdate = false,
  ): Promise<void> {
    const room = `scan-${scanId}`;
    const payload: ScanProgressData = {
      scanId,
      progress,
      message,
      data,
      timestamp: new Date().toISOString(),
    };

    // Update progress in database (skip if caller will handle it)
    if (!skipDbUpdate) {
      await this.updateProgressWithRetry(scanId, progress, message);
    }

    this.server.to(room).emit('scan-progress', payload);
    this.logger.debug(
      `[WS_PROGRESS] Scan ${scanId}: ${progress}% - ${message}`,
    );
  }

  /**
   * Update scan progress in DB with retry logic
   */
  private async updateProgressWithRetry(
    scanId: number,
    progress: number,
    message: string,
    maxRetries: number = 3,
  ): Promise<void> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const scan = await this.scanRepository.findOne({ id: scanId });
        if (scan) {
          scan.progress = progress;
          scan.progressMessage = message;
          await this.em.flush();
          return; // Success
        } else {
          this.logger.warn(`[WS_PROGRESS_RETRY] Scan ${scanId} not found`);
          return; // Can't update if scan doesn't exist
        }
      } catch (error) {
        lastError = error;
        this.logger.warn(
          `[WS_PROGRESS_RETRY] Failed to update progress (attempt ${attempt}/${maxRetries}): ${error.message}`,
        );

        if (attempt < maxRetries) {
          // Short exponential backoff: 50ms, 100ms, 200ms
          const delay = 50 * Math.pow(2, attempt - 1);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // All retries failed - log but don't throw (progress updates are not critical)
    this.logger.error(
      `[WS_PROGRESS_RETRY] Failed to update progress for scan ${scanId} after ${maxRetries} attempts: ${lastError?.message}`,
    );
  }

  /**
   * 스캔 완료 브로드캐스트
   */
  sendCompleted(scanId: number, result: any): void {
    const room = `scan-${scanId}`;
    const payload: ScanCompletedData = {
      scanId,
      result,
      timestamp: new Date().toISOString(),
    };

    this.server.to(room).emit('scan-completed', payload);
    this.logger.log(`[WS_COMPLETED] Scan ${scanId} completed successfully`);
  }

  /**
   * 스캔 실패 브로드캐스트
   */
  sendFailed(scanId: number, error: string): void {
    const room = `scan-${scanId}`;
    const payload: ScanFailedData = {
      scanId,
      error,
      timestamp: new Date().toISOString(),
    };

    this.server.to(room).emit('scan-failed', payload);
    this.logger.error(`[WS_FAILED] Scan ${scanId} failed: ${error}`);
  }

  /**
   * 특정 스캔의 연결된 클라이언트 수 확인 (디버깅용)
   */
  getSubscriberCount(scanId: number): number {
    const room = `scan-${scanId}`;
    const sockets = this.server.sockets.adapter.rooms.get(room);
    return sockets ? sockets.size : 0;
  }
}
