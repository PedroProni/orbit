import { Injectable } from '@nestjs/common';
import { Observable, Subject, filter } from 'rxjs';
import { TaskEvent } from '@domain/types/task-event.type';

@Injectable()
export class RealtimeService {
  private readonly bus = new Subject<TaskEvent>();

  all(): Observable<TaskEvent> {
    return this.bus.asObservable();
  }

  publish(event: Omit<TaskEvent, 'at'>): void {
    this.bus.next({ ...event, at: new Date() });
  }

  stream(workspaceId: string): Observable<TaskEvent> {
    return this.bus.pipe(filter((event) => event.workspaceId === workspaceId));
  }
}
