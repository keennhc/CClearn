import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserRole } from '@home-owners-hub/shared-types';
import { CommunityMessage } from '../../community/entities/community-message.entity';
import { Announcement } from '../../announcements/entities/announcement.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column()
  email: string;

  @Column()
  passwordHash: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Column({ default: true })
  isActive: boolean;

  @Column('varchar', { nullable: true })
  profileImageUrl: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => CommunityMessage, (message) => message.user)
  messages: CommunityMessage[];

  @OneToMany(() => Announcement, (announcement) => announcement.author)
  announcements: Announcement[];
}
