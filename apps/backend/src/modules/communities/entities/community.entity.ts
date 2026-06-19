import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { CommunityMember } from './community-member.entity';
import { CommunityMessage } from '../../community/entities/community-message.entity';
import { Announcement } from '../../announcements/entities/announcement.entity';

@Entity('communities')
export class Community {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Index({ unique: true })
  @Column()
  code: string;

  @Column('text', { nullable: true })
  description: string | null;

  @Column({ default: true })
  isActive: boolean;

  @Column()
  createdBy: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'createdBy' })
  creator: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => CommunityMember, (member) => member.community)
  members: CommunityMember[];

  @OneToMany(() => CommunityMessage, (message) => message.community)
  messages: CommunityMessage[];

  @OneToMany(() => Announcement, (announcement) => announcement.community)
  announcements: Announcement[];
}
