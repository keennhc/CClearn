import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { AiChatSession } from './ai-chat-session.entity';

@Entity('ai_chat_messages')
export class AiChatMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  sessionId: string;

  @Column()
  role: 'user' | 'model';

  @Column('text')
  content: string;

  @ManyToOne(() => AiChatSession, (session) => session.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sessionId' })
  session: AiChatSession;

  @CreateDateColumn()
  createdAt: Date;
}
