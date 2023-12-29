import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { InfraModule } from './infra/infra.module';

@Module({
  imports: [
    InfraModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],

  controllers: [],
  providers: [],
})
export class AppModule {}
