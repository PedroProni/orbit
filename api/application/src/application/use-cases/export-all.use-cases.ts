import { PasswordLoginUseCase } from '@application/use-cases/auth/password-login.use-case';
import { LogoutUseCase } from '@application/use-cases/auth/logout.use-case';
import { ListSessionsUseCase } from '@application/use-cases/auth/list-sessions.use-case';
import { RevokeSessionUseCase } from '@application/use-cases/auth/revoke-session.use-case';
import { ForgotPasswordUseCase } from '@application/use-cases/auth/forgot-password.use-case';
import { CheckAccessLinkUseCase } from '@application/use-cases/auth/check-access-link.use-case';
import { SetPasswordUseCase } from '@application/use-cases/auth/set-password.use-case';
import { ChangePasswordUseCase } from '@application/use-cases/auth/change-password.use-case';
import { InviteUserUseCase } from '@application/use-cases/user/invite-user.use-case';
import { GenerateAccessLinkUseCase } from '@application/use-cases/user/generate-access-link.use-case';
import { RevokeUserSessionsUseCase } from '@application/use-cases/user/revoke-user-sessions.use-case';
import { ListUserAccessUseCase } from '@application/use-cases/user/list-user-access.use-case';
import { LoginThrottleService } from '@application/services/login-throttle.service';
import { AccessLinkService } from '@application/services/access-link.service';
import { LoginAccessUseCase } from '@application/use-cases/auth/login-access.use-case';
import { DevLoginUseCase } from '@application/use-cases/auth/dev-login.use-case';
import { GetMeUseCase } from '@application/use-cases/auth/get-me.use-case';
import { ListUsersUseCase } from '@application/use-cases/user/list-users.use-case';
import { ChangeUserRoleUseCase } from '@application/use-cases/user/change-user-role.use-case';
import { ChangeUserStatusUseCase } from '@application/use-cases/user/change-user-status.use-case';
import { CreateApiTokenUseCase } from '@application/use-cases/token/create-api-token.use-case';
import { ListApiTokensUseCase } from '@application/use-cases/token/list-api-tokens.use-case';
import { RevokeApiTokenUseCase } from '@application/use-cases/token/revoke-api-token.use-case';
import { AuditService } from '@application/services/audit.service';
import { UserProvisioningService } from '@application/services/user-provisioning.service';
import { GetHierarchyUseCase } from '@application/use-cases/hierarchy/get-hierarchy.use-case';
import { CreateSpaceUseCase } from '@application/use-cases/hierarchy/create-space.use-case';
import { UpdateSpaceUseCase } from '@application/use-cases/hierarchy/update-space.use-case';
import { CreateFolderUseCase } from '@application/use-cases/hierarchy/create-folder.use-case';
import { RenameFolderUseCase } from '@application/use-cases/hierarchy/rename-folder.use-case';
import { DeleteFolderUseCase } from '@application/use-cases/hierarchy/delete-folder.use-case';
import { CreateListUseCase } from '@application/use-cases/hierarchy/create-list.use-case';
import { UpdateListUseCase } from '@application/use-cases/hierarchy/update-list.use-case';
import { DeleteListUseCase } from '@application/use-cases/hierarchy/delete-list.use-case';
import { CreateCustomFieldUseCase } from '@application/use-cases/custom-field/create-custom-field.use-case';
import { UpdateCustomFieldUseCase } from '@application/use-cases/custom-field/update-custom-field.use-case';
import { ListCustomFieldsUseCase } from '@application/use-cases/custom-field/list-custom-fields.use-case';
import { DeleteCustomFieldUseCase } from '@application/use-cases/custom-field/delete-custom-field.use-case';
import { CreateTaskUseCase } from '@application/use-cases/task/create-task.use-case';
import { UpdateTaskUseCase } from '@application/use-cases/task/update-task.use-case';
import { GetTaskUseCase } from '@application/use-cases/task/get-task.use-case';
import { TaskActivityUseCase } from '@application/use-cases/task/task-activity.use-case';
import { ListTasksUseCase } from '@application/use-cases/task/list-tasks.use-case';
import { TaskAssigneeCountsUseCase } from '@application/use-cases/task/task-assignee-counts.use-case';
import { DeleteTaskUseCase } from '@application/use-cases/task/delete-task.use-case';
import { RealtimeService } from '@application/services/realtime.service';
import { NotificationService } from '@application/services/notification.service';
import { WorkspaceMembersService } from '@application/services/workspace-members.service';
import { CustomFieldValidationService } from '@application/services/custom-field-validation.service';
import { CustomFieldListsService } from '@application/services/custom-field-lists.service';
import { CreateCommentUseCase } from '@application/use-cases/comment/create-comment.use-case';
import { EditCommentUseCase } from '@application/use-cases/comment/edit-comment.use-case';
import { DeleteCommentUseCase } from '@application/use-cases/comment/delete-comment.use-case';
import { ListCommentsUseCase } from '@application/use-cases/comment/list-comments.use-case';
import { UpsertDailyLogUseCase } from '@application/use-cases/comment/upsert-daily-log.use-case';
import { ListNotificationsUseCase } from '@application/use-cases/notification/list-notifications.use-case';
import { MarkNotificationsReadUseCase } from '@application/use-cases/notification/mark-notifications-read.use-case';
import { CommentWriterService } from '@application/services/comment-writer.service';
import { RequestUploadUseCase } from '@application/use-cases/attachment/request-upload.use-case';
import { ConfirmAttachmentUseCase } from '@application/use-cases/attachment/confirm-attachment.use-case';
import { DownloadAttachmentUseCase } from '@application/use-cases/attachment/download-attachment.use-case';
import { AttachmentContentUseCase } from '@application/use-cases/attachment/attachment-content.use-case';
import { ListAttachmentsUseCase } from '@application/use-cases/attachment/list-attachments.use-case';
import { DeleteAttachmentUseCase } from '@application/use-cases/attachment/delete-attachment.use-case';
import { SearchUseCase } from '@application/use-cases/task/search.use-case';
import { ClickupListTasksUseCase } from '@application/use-cases/compat/clickup-list-tasks.use-case';
import { ClickupWriteTaskUseCase } from '@application/use-cases/compat/clickup-write-task.use-case';
import { ClickupCommentsUseCase } from '@application/use-cases/compat/clickup-comments.use-case';
import { ClickupHierarchyUseCase } from '@application/use-cases/compat/clickup-hierarchy.use-case';
import { ClickupAttachmentUseCase } from '@application/use-cases/compat/clickup-attachment.use-case';
import { ClickupUserResolver } from '@application/services/compat/clickup-user-resolver.service';
import { ClickupTaskAssembler } from '@application/services/compat/clickup-task-assembler.service';
import { ClickupCommentAssembler } from '@application/services/compat/clickup-comment-assembler.service';
import { HandleGithubWebhookUseCase } from '@application/use-cases/webhook/handle-github-webhook.use-case';

import { SavedViewsUseCase } from '@application/use-cases/saved-view/saved-views.use-case';
import { TaskDependenciesUseCase } from '@application/use-cases/planning/task-dependencies.use-case';
import { TaskPlansUseCase } from '@application/use-cases/planning/task-plans.use-case';
import { TimeTrackingUseCase } from '@application/use-cases/planning/time-tracking.use-case';
import { TaskTemplatesUseCase } from '@application/use-cases/planning/task-templates.use-case';
import { TaskRecurrenceUseCase } from '@application/use-cases/planning/task-recurrence.use-case';
import { RecurrenceScheduler } from '@application/services/recurrence-scheduler.service';
import { DocsUseCase } from '@application/use-cases/doc/docs.use-case';
import { GoalsUseCase } from '@application/use-cases/goal/goals.use-case';
import { DashboardsUseCase } from '@application/use-cases/dashboard/dashboards.use-case';
import { GuestAccessService } from '@application/services/guest-access.service';
import { TaskAccessService } from '@application/services/task-access.service';
import { ListTaskPullRequestsUseCase } from '@application/use-cases/task/list-task-pull-requests.use-case';
import { LinkTaskPullRequestUseCase } from '@application/use-cases/task/link-task-pull-request.use-case';
import { UnlinkTaskPullRequestUseCase } from '@application/use-cases/task/unlink-task-pull-request.use-case';
import { ListTaskPrintsUseCase } from '@application/use-cases/attachment/list-task-prints.use-case';
import { TaskQueryFilterService } from '@application/services/task-query-filter.service';
import { TaskAttachmentSummaryService } from '@application/services/task-attachment-summary.service';
import { FormsUseCase } from '@application/use-cases/form/forms.use-case';
import { AutomationsUseCase } from '@application/use-cases/automation/automations.use-case';
import { AutomationRunner } from '@application/services/automation-runner.service';
import { ChatUseCase } from '@application/use-cases/chat/chat.use-case';
import { UserGroupsUseCase } from '@application/use-cases/group/user-groups.use-case';
import { GuestAccessUseCase } from '@application/use-cases/user/guest-access.use-case';
import { InboxUseCase } from '@application/use-cases/inbox/inbox.use-case';
export default [
  LoginAccessUseCase,
  DevLoginUseCase,
  GetMeUseCase,
  ListUsersUseCase,
  ChangeUserRoleUseCase,
  ChangeUserStatusUseCase,
  CreateApiTokenUseCase,
  ListApiTokensUseCase,
  RevokeApiTokenUseCase,
  AuditService,
  UserProvisioningService,
  GetHierarchyUseCase,
  CreateSpaceUseCase,
  UpdateSpaceUseCase,
  CreateFolderUseCase,
  RenameFolderUseCase,
  DeleteFolderUseCase,
  CreateListUseCase,
  UpdateListUseCase,
  DeleteListUseCase,
  CreateCustomFieldUseCase,
  ListCustomFieldsUseCase,
  DeleteCustomFieldUseCase,
  UpdateCustomFieldUseCase,
  CreateTaskUseCase,
  UpdateTaskUseCase,
  GetTaskUseCase,
  ListTasksUseCase,
  TaskAssigneeCountsUseCase,
  DeleteTaskUseCase,
  RealtimeService,
  NotificationService,
  WorkspaceMembersService,
  CustomFieldValidationService,
  CustomFieldListsService,
  CreateCommentUseCase,
  EditCommentUseCase,
  DeleteCommentUseCase,
  ListCommentsUseCase,
  UpsertDailyLogUseCase,
  ListNotificationsUseCase,
  MarkNotificationsReadUseCase,
  CommentWriterService,
  RequestUploadUseCase,
  ConfirmAttachmentUseCase,
  DownloadAttachmentUseCase,
  AttachmentContentUseCase,
  ListAttachmentsUseCase,
  DeleteAttachmentUseCase,
  SearchUseCase,
  ClickupListTasksUseCase,
  ClickupWriteTaskUseCase,
  ClickupCommentsUseCase,
  ClickupHierarchyUseCase,
  ClickupAttachmentUseCase,
  ClickupUserResolver,
  ClickupTaskAssembler,
  ClickupCommentAssembler,
  HandleGithubWebhookUseCase,
  SavedViewsUseCase,
  TaskDependenciesUseCase,
  TaskPlansUseCase,
  TimeTrackingUseCase,
  TaskTemplatesUseCase,
  TaskRecurrenceUseCase,
  RecurrenceScheduler,
  DocsUseCase,
  GoalsUseCase,
  DashboardsUseCase,
  GuestAccessService,
  TaskAccessService,
  ListTaskPullRequestsUseCase,
  LinkTaskPullRequestUseCase,
  UnlinkTaskPullRequestUseCase,
  ListTaskPrintsUseCase,
  TaskQueryFilterService,
  TaskAttachmentSummaryService,
  FormsUseCase,
  AutomationsUseCase,
  AutomationRunner,
  ChatUseCase,
  UserGroupsUseCase,
  GuestAccessUseCase,
  InboxUseCase,
  TaskActivityUseCase,
  PasswordLoginUseCase,
  LogoutUseCase,
  ListSessionsUseCase,
  RevokeSessionUseCase,
  ForgotPasswordUseCase,
  CheckAccessLinkUseCase,
  SetPasswordUseCase,
  ChangePasswordUseCase,
  InviteUserUseCase,
  GenerateAccessLinkUseCase,
  RevokeUserSessionsUseCase,
  ListUserAccessUseCase,
  LoginThrottleService,
  AccessLinkService,
];
