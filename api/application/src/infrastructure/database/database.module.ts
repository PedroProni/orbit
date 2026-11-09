import { IndexInitializer } from './index-initializer.service';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConnectionModule } from '@infrastructure/database/connection/mongo-connect.module';
import { EnvConfigModule } from '@common/env/env-config.module';
import { HelperModule } from '@common/helpers/helper.module';
import { Workspace, WorkspaceSchema } from '@infrastructure/database/schemas/workspace.schema';
import { User, UserSchema } from '@infrastructure/database/schemas/user.schema';
import { Space, SpaceSchema } from '@infrastructure/database/schemas/space.schema';
import { Folder, FolderSchema } from '@infrastructure/database/schemas/folder.schema';
import { TaskList, TaskListSchema } from '@infrastructure/database/schemas/task-list.schema';
import { CustomFieldDefinition, CustomFieldDefinitionSchema } from '@infrastructure/database/schemas/custom-field-definition.schema';
import { Task, TaskSchema } from '@infrastructure/database/schemas/task.schema';
import { Comment, CommentSchema } from '@infrastructure/database/schemas/comment.schema';
import { Attachment, AttachmentSchema } from '@infrastructure/database/schemas/attachment.schema';
import { Notification, NotificationSchema } from '@infrastructure/database/schemas/notification.schema';
import { ApiToken, ApiTokenSchema } from '@infrastructure/database/schemas/api-token.schema';
import { UserCredential, UserCredentialSchema } from '@infrastructure/database/schemas/user-credential.schema';
import { AuthToken, AuthTokenSchema } from '@infrastructure/database/schemas/auth-token.schema';
import { AuthSession, AuthSessionSchema } from '@infrastructure/database/schemas/auth-session.schema';
import { LoginAttempt, LoginAttemptSchema } from '@infrastructure/database/schemas/login-attempt.schema';
import { AuditLog, AuditLogSchema } from '@infrastructure/database/schemas/audit-log.schema';
import { PullRequestLink, PullRequestLinkSchema } from '@infrastructure/database/schemas/pull-request-link.schema';
import { WebhookDelivery, WebhookDeliverySchema } from '@infrastructure/database/schemas/webhook-delivery.schema';
import { SavedView, SavedViewSchema } from '@infrastructure/database/schemas/saved-view.schema';
import { TaskDependency, TaskDependencySchema } from '@infrastructure/database/schemas/task-dependency.schema';
import { TaskPlan, TaskPlanSchema } from '@infrastructure/database/schemas/task-plan.schema';
import { TimeEntry, TimeEntrySchema } from '@infrastructure/database/schemas/time-entry.schema';
import { TaskTemplate, TaskTemplateSchema } from '@infrastructure/database/schemas/task-template.schema';
import { RecurrenceRule, RecurrenceRuleSchema } from '@infrastructure/database/schemas/recurrence-rule.schema';
import { Doc, DocSchema } from '@infrastructure/database/schemas/doc.schema';
import { Goal, GoalSchema } from '@infrastructure/database/schemas/goal.schema';
import { Dashboard, DashboardSchema } from '@infrastructure/database/schemas/dashboard.schema';
import { Form, FormSchema } from '@infrastructure/database/schemas/form.schema';
import { Automation, AutomationSchema } from '@infrastructure/database/schemas/automation.schema';
import { ChatChannel, ChatChannelSchema } from '@infrastructure/database/schemas/chat-channel.schema';
import { ChatMessage, ChatMessageSchema } from '@infrastructure/database/schemas/chat-message.schema';
import { UserGroup, UserGroupSchema } from '@infrastructure/database/schemas/user-group.schema';
import { GuestAccess, GuestAccessSchema } from '@infrastructure/database/schemas/guest-access.schema';
import { WorkspacePersistence } from '@infrastructure/database/persistence/workspace.persistence';
import { UserPersistence } from '@infrastructure/database/persistence/user.persistence';
import { SpacePersistence } from '@infrastructure/database/persistence/space.persistence';
import { FolderPersistence } from '@infrastructure/database/persistence/folder.persistence';
import { TaskListPersistence } from '@infrastructure/database/persistence/task-list.persistence';
import { CustomFieldDefinitionPersistence } from '@infrastructure/database/persistence/custom-field-definition.persistence';
import { TaskPersistence } from '@infrastructure/database/persistence/task.persistence';
import { CommentPersistence } from '@infrastructure/database/persistence/comment.persistence';
import { AttachmentPersistence } from '@infrastructure/database/persistence/attachment.persistence';
import { NotificationPersistence } from '@infrastructure/database/persistence/notification.persistence';
import { ApiTokenPersistence } from '@infrastructure/database/persistence/api-token.persistence';
import { UserCredentialPersistence } from '@infrastructure/database/persistence/user-credential.persistence';
import { AuthTokenPersistence } from '@infrastructure/database/persistence/auth-token.persistence';
import { AuthSessionPersistence } from '@infrastructure/database/persistence/auth-session.persistence';
import { LoginAttemptPersistence } from '@infrastructure/database/persistence/login-attempt.persistence';
import { AuditLogPersistence } from '@infrastructure/database/persistence/audit-log.persistence';
import { PullRequestLinkPersistence } from '@infrastructure/database/persistence/pull-request-link.persistence';
import { WebhookDeliveryPersistence } from '@infrastructure/database/persistence/webhook-delivery.persistence';
import { SavedViewPersistence } from '@infrastructure/database/persistence/saved-view.persistence';
import { TaskDependencyPersistence } from '@infrastructure/database/persistence/task-dependency.persistence';
import { TaskPlanPersistence } from '@infrastructure/database/persistence/task-plan.persistence';
import { TimeEntryPersistence } from '@infrastructure/database/persistence/time-entry.persistence';
import { TaskTemplatePersistence } from '@infrastructure/database/persistence/task-template.persistence';
import { RecurrenceRulePersistence } from '@infrastructure/database/persistence/recurrence-rule.persistence';
import { DocPersistence } from '@infrastructure/database/persistence/doc.persistence';
import { GoalPersistence } from '@infrastructure/database/persistence/goal.persistence';
import { DashboardPersistence } from '@infrastructure/database/persistence/dashboard.persistence';
import { FormPersistence } from '@infrastructure/database/persistence/form.persistence';
import { AutomationPersistence } from '@infrastructure/database/persistence/automation.persistence';
import { ChatChannelPersistence } from '@infrastructure/database/persistence/chat-channel.persistence';
import { ChatMessagePersistence } from '@infrastructure/database/persistence/chat-message.persistence';
import { UserGroupPersistence } from '@infrastructure/database/persistence/user-group.persistence';
import { GuestAccessPersistence } from '@infrastructure/database/persistence/guest-access.persistence';

@Module({
  imports: [
    ConnectionModule,
    EnvConfigModule,
    HelperModule,
    MongooseModule.forFeature([
      { name: Workspace.name, schema: WorkspaceSchema },
      { name: User.name, schema: UserSchema },
      { name: Space.name, schema: SpaceSchema },
      { name: Folder.name, schema: FolderSchema },
      { name: TaskList.name, schema: TaskListSchema },
      { name: CustomFieldDefinition.name, schema: CustomFieldDefinitionSchema },
      { name: Task.name, schema: TaskSchema },
      { name: Comment.name, schema: CommentSchema },
      { name: Attachment.name, schema: AttachmentSchema },
      { name: Notification.name, schema: NotificationSchema },
      { name: ApiToken.name, schema: ApiTokenSchema },
      { name: UserCredential.name, schema: UserCredentialSchema },
      { name: AuthToken.name, schema: AuthTokenSchema },
      { name: AuthSession.name, schema: AuthSessionSchema },
      { name: LoginAttempt.name, schema: LoginAttemptSchema },
      { name: AuditLog.name, schema: AuditLogSchema },
      { name: PullRequestLink.name, schema: PullRequestLinkSchema },
      { name: WebhookDelivery.name, schema: WebhookDeliverySchema },
      { name: SavedView.name, schema: SavedViewSchema },
      { name: TaskDependency.name, schema: TaskDependencySchema },
      { name: TaskPlan.name, schema: TaskPlanSchema },
      { name: TimeEntry.name, schema: TimeEntrySchema },
      { name: TaskTemplate.name, schema: TaskTemplateSchema },
      { name: RecurrenceRule.name, schema: RecurrenceRuleSchema },
      { name: Doc.name, schema: DocSchema },
      { name: Goal.name, schema: GoalSchema },
      { name: Dashboard.name, schema: DashboardSchema },
      { name: Form.name, schema: FormSchema },
      { name: Automation.name, schema: AutomationSchema },
      { name: ChatChannel.name, schema: ChatChannelSchema },
      { name: ChatMessage.name, schema: ChatMessageSchema },
      { name: UserGroup.name, schema: UserGroupSchema },
      { name: GuestAccess.name, schema: GuestAccessSchema },
    ]),
  ],
  providers: [
    IndexInitializer,
    UserCredentialPersistence,
    AuthTokenPersistence,
    AuthSessionPersistence,
    LoginAttemptPersistence,
    WorkspacePersistence,
    UserPersistence,
    SpacePersistence,
    FolderPersistence,
    TaskListPersistence,
    CustomFieldDefinitionPersistence,
    TaskPersistence,
    CommentPersistence,
    AttachmentPersistence,
    NotificationPersistence,
    ApiTokenPersistence,
    AuditLogPersistence,
    PullRequestLinkPersistence,
    WebhookDeliveryPersistence,
    SavedViewPersistence,
    TaskDependencyPersistence,
    TaskPlanPersistence,
    TimeEntryPersistence,
    TaskTemplatePersistence,
    RecurrenceRulePersistence,
    DocPersistence,
    GoalPersistence,
    DashboardPersistence,
    FormPersistence,
    AutomationPersistence,
    ChatChannelPersistence,
    ChatMessagePersistence,
    UserGroupPersistence,
    GuestAccessPersistence,
  ],
  exports: [
    ConnectionModule,
    MongooseModule,
    UserCredentialPersistence,
    AuthTokenPersistence,
    AuthSessionPersistence,
    LoginAttemptPersistence,
    WorkspacePersistence,
    UserPersistence,
    SpacePersistence,
    FolderPersistence,
    TaskListPersistence,
    CustomFieldDefinitionPersistence,
    TaskPersistence,
    CommentPersistence,
    AttachmentPersistence,
    NotificationPersistence,
    ApiTokenPersistence,
    AuditLogPersistence,
    PullRequestLinkPersistence,
    WebhookDeliveryPersistence,
    SavedViewPersistence,
    TaskDependencyPersistence,
    TaskPlanPersistence,
    TimeEntryPersistence,
    TaskTemplatePersistence,
    RecurrenceRulePersistence,
    DocPersistence,
    GoalPersistence,
    DashboardPersistence,
    FormPersistence,
    AutomationPersistence,
    ChatChannelPersistence,
    ChatMessagePersistence,
    UserGroupPersistence,
    GuestAccessPersistence,
  ],
})
export class DatabaseModule {}
