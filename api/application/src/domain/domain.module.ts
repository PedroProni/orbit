import { UserCredentialPersistence } from '@infrastructure/database/persistence/user-credential.persistence';
import { AuthTokenPersistence } from '@infrastructure/database/persistence/auth-token.persistence';
import { AuthSessionPersistence } from '@infrastructure/database/persistence/auth-session.persistence';
import { LoginAttemptPersistence } from '@infrastructure/database/persistence/login-attempt.persistence';
import { USER_CREDENTIAL_INJECT_TOKEN, AUTH_TOKEN_INJECT_TOKEN, AUTH_SESSION_INJECT_TOKEN, LOGIN_ATTEMPT_INJECT_TOKEN } from '@domain/constants/inject-token.constant';
import { Module } from '@nestjs/common';
import { DatabaseModule } from '@infrastructure/database/database.module';
import { WORKSPACE_INJECT_TOKEN, USER_INJECT_TOKEN, SPACE_INJECT_TOKEN, FOLDER_INJECT_TOKEN, TASK_LIST_INJECT_TOKEN, CUSTOM_FIELD_DEFINITION_INJECT_TOKEN, TASK_INJECT_TOKEN, COMMENT_INJECT_TOKEN, ATTACHMENT_INJECT_TOKEN, NOTIFICATION_INJECT_TOKEN, API_TOKEN_INJECT_TOKEN, AUDIT_LOG_INJECT_TOKEN, PULL_REQUEST_LINK_INJECT_TOKEN, WEBHOOK_DELIVERY_INJECT_TOKEN, SAVED_VIEW_INJECT_TOKEN, TASK_DEPENDENCY_INJECT_TOKEN, TASK_PLAN_INJECT_TOKEN, TIME_ENTRY_INJECT_TOKEN, TASK_TEMPLATE_INJECT_TOKEN, RECURRENCE_RULE_INJECT_TOKEN, DOC_INJECT_TOKEN, GOAL_INJECT_TOKEN, DASHBOARD_INJECT_TOKEN, FORM_INJECT_TOKEN, AUTOMATION_INJECT_TOKEN, AUTOMATION_RUN_INJECT_TOKEN, CHAT_CHANNEL_INJECT_TOKEN, CHAT_MESSAGE_INJECT_TOKEN, USER_GROUP_INJECT_TOKEN, GUEST_ACCESS_INJECT_TOKEN, GITHUB_REF_INJECT_TOKEN, GITHUB_SYNC_STATE_INJECT_TOKEN } from '@domain/constants/inject-token.constant';
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
import { AuditLogPersistence } from '@infrastructure/database/persistence/audit-log.persistence';
import { PullRequestLinkPersistence } from '@infrastructure/database/persistence/pull-request-link.persistence';
import { GithubRefPersistence } from '@infrastructure/database/persistence/github-ref.persistence';
import { GithubSyncStatePersistence } from '@infrastructure/database/persistence/github-sync-state.persistence';
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
import { AutomationRunPersistence } from '@infrastructure/database/persistence/automation-run.persistence';
import { ChatChannelPersistence } from '@infrastructure/database/persistence/chat-channel.persistence';
import { ChatMessagePersistence } from '@infrastructure/database/persistence/chat-message.persistence';
import { UserGroupPersistence } from '@infrastructure/database/persistence/user-group.persistence';
import { GuestAccessPersistence } from '@infrastructure/database/persistence/guest-access.persistence';

@Module({
  imports: [DatabaseModule],
  providers: [
    { provide: WORKSPACE_INJECT_TOKEN, useExisting: WorkspacePersistence },
    { provide: USER_INJECT_TOKEN, useExisting: UserPersistence },
    { provide: SPACE_INJECT_TOKEN, useExisting: SpacePersistence },
    { provide: FOLDER_INJECT_TOKEN, useExisting: FolderPersistence },
    { provide: TASK_LIST_INJECT_TOKEN, useExisting: TaskListPersistence },
    { provide: CUSTOM_FIELD_DEFINITION_INJECT_TOKEN, useExisting: CustomFieldDefinitionPersistence },
    { provide: TASK_INJECT_TOKEN, useExisting: TaskPersistence },
    { provide: COMMENT_INJECT_TOKEN, useExisting: CommentPersistence },
    { provide: ATTACHMENT_INJECT_TOKEN, useExisting: AttachmentPersistence },
    { provide: NOTIFICATION_INJECT_TOKEN, useExisting: NotificationPersistence },
    { provide: API_TOKEN_INJECT_TOKEN, useExisting: ApiTokenPersistence },
    { provide: USER_CREDENTIAL_INJECT_TOKEN, useExisting: UserCredentialPersistence },
    { provide: AUTH_TOKEN_INJECT_TOKEN, useExisting: AuthTokenPersistence },
    { provide: AUTH_SESSION_INJECT_TOKEN, useExisting: AuthSessionPersistence },
    { provide: LOGIN_ATTEMPT_INJECT_TOKEN, useExisting: LoginAttemptPersistence },
    { provide: AUDIT_LOG_INJECT_TOKEN, useExisting: AuditLogPersistence },
    { provide: PULL_REQUEST_LINK_INJECT_TOKEN, useExisting: PullRequestLinkPersistence },
    { provide: GITHUB_REF_INJECT_TOKEN, useExisting: GithubRefPersistence },
    { provide: GITHUB_SYNC_STATE_INJECT_TOKEN, useExisting: GithubSyncStatePersistence },
    { provide: WEBHOOK_DELIVERY_INJECT_TOKEN, useExisting: WebhookDeliveryPersistence },
    { provide: SAVED_VIEW_INJECT_TOKEN, useExisting: SavedViewPersistence },
    { provide: TASK_DEPENDENCY_INJECT_TOKEN, useExisting: TaskDependencyPersistence },
    { provide: TASK_PLAN_INJECT_TOKEN, useExisting: TaskPlanPersistence },
    { provide: TIME_ENTRY_INJECT_TOKEN, useExisting: TimeEntryPersistence },
    { provide: TASK_TEMPLATE_INJECT_TOKEN, useExisting: TaskTemplatePersistence },
    { provide: RECURRENCE_RULE_INJECT_TOKEN, useExisting: RecurrenceRulePersistence },
    { provide: DOC_INJECT_TOKEN, useExisting: DocPersistence },
    { provide: GOAL_INJECT_TOKEN, useExisting: GoalPersistence },
    { provide: DASHBOARD_INJECT_TOKEN, useExisting: DashboardPersistence },
    { provide: FORM_INJECT_TOKEN, useExisting: FormPersistence },
    { provide: AUTOMATION_INJECT_TOKEN, useExisting: AutomationPersistence },
    { provide: AUTOMATION_RUN_INJECT_TOKEN, useExisting: AutomationRunPersistence },
    { provide: CHAT_CHANNEL_INJECT_TOKEN, useExisting: ChatChannelPersistence },
    { provide: CHAT_MESSAGE_INJECT_TOKEN, useExisting: ChatMessagePersistence },
    { provide: USER_GROUP_INJECT_TOKEN, useExisting: UserGroupPersistence },
    { provide: GUEST_ACCESS_INJECT_TOKEN, useExisting: GuestAccessPersistence },
  ],
  exports: [
    WORKSPACE_INJECT_TOKEN,
    USER_INJECT_TOKEN,
    SPACE_INJECT_TOKEN,
    FOLDER_INJECT_TOKEN,
    TASK_LIST_INJECT_TOKEN,
    CUSTOM_FIELD_DEFINITION_INJECT_TOKEN,
    TASK_INJECT_TOKEN,
    COMMENT_INJECT_TOKEN,
    ATTACHMENT_INJECT_TOKEN,
    NOTIFICATION_INJECT_TOKEN,
    API_TOKEN_INJECT_TOKEN,
    USER_CREDENTIAL_INJECT_TOKEN,
    AUTH_TOKEN_INJECT_TOKEN,
    AUTH_SESSION_INJECT_TOKEN,
    LOGIN_ATTEMPT_INJECT_TOKEN,
    AUDIT_LOG_INJECT_TOKEN,
    PULL_REQUEST_LINK_INJECT_TOKEN,
    GITHUB_REF_INJECT_TOKEN,
    GITHUB_SYNC_STATE_INJECT_TOKEN,
    WEBHOOK_DELIVERY_INJECT_TOKEN,
    SAVED_VIEW_INJECT_TOKEN,
    TASK_DEPENDENCY_INJECT_TOKEN,
    TASK_PLAN_INJECT_TOKEN,
    TIME_ENTRY_INJECT_TOKEN,
    TASK_TEMPLATE_INJECT_TOKEN,
    RECURRENCE_RULE_INJECT_TOKEN,
    DOC_INJECT_TOKEN,
    GOAL_INJECT_TOKEN,
    DASHBOARD_INJECT_TOKEN,
    FORM_INJECT_TOKEN,
    AUTOMATION_INJECT_TOKEN,
    AUTOMATION_RUN_INJECT_TOKEN,
    CHAT_CHANNEL_INJECT_TOKEN,
    CHAT_MESSAGE_INJECT_TOKEN,
    USER_GROUP_INJECT_TOKEN,
    GUEST_ACCESS_INJECT_TOKEN,
  ],
})
export class DomainModule {}
