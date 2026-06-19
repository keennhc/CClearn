import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { CommunityMemberRole } from '@home-owners-hub/shared-types';
import { User } from '../../users/entities/user.entity';
import { Community } from './community.entity';

@Entity('community_members')
@Unique(['userId', 'communityId'])
export class CommunityMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  communityId: string;

  @Column({
    type: 'enum',
    enum: CommunityMemberRole,
    default: CommunityMemberRole.COMMUNITY_MEMBER,
  })
  role: CommunityMemberRole;

  @CreateDateColumn()
  joinedAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Community, (community) => community.members, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'communityId' })
  community: Community;
}
