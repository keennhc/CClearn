import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Community } from '../../communities/entities/community.entity';

@Entity('community_messages')
export class CommunityMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text', { nullable: true })
  message: string | null;

  @Column('varchar', { nullable: true })
  attachmentUrl: string | null;

  @Column('varchar', { nullable: true })
  attachmentType: string | null;

  @Column('varchar', { nullable: true })
  attachmentName: string | null;

  @Column()
  userId: string;

  @Column()
  communityId: string;

  @ManyToOne(() => User, (user) => user.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Community, (community) => community.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'communityId' })
  community: Community;

  @CreateDateColumn()
  createdAt: Date;
}
