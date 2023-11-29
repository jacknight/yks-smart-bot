import { Injectable, Logger } from '@nestjs/common';
import { Context, ContextOf } from 'necord';

@Injectable()
export class Ready {
  private readonly logger = new Logger(Ready.name);

  public async onReady(@Context() [client]: ContextOf<'ready'>) {
    this.logger.log(`Bot logged in as ${client.user.username}`);
  }
}
