import { INestApplication } from '@nestjs/common';
import { createTestApp, TestContext } from './helpers/create-test-app';
import { AccessLinkService } from '../src/application/services/access-link.service';
import { LoginThrottleService } from '../src/application/services/login-throttle.service';
import { ChangePasswordUseCase } from '../src/application/use-cases/auth/change-password.use-case';
import { CheckAccessLinkUseCase } from '../src/application/use-cases/auth/check-access-link.use-case';
import { ForgotPasswordUseCase } from '../src/application/use-cases/auth/forgot-password.use-case';
import { ListSessionsUseCase } from '../src/application/use-cases/auth/list-sessions.use-case';
import { LogoutUseCase } from '../src/application/use-cases/auth/logout.use-case';
import { PasswordLoginUseCase } from '../src/application/use-cases/auth/password-login.use-case';
import { RevokeSessionUseCase } from '../src/application/use-cases/auth/revoke-session.use-case';
import { SetPasswordUseCase } from '../src/application/use-cases/auth/set-password.use-case';
import { GenerateAccessLinkUseCase } from '../src/application/use-cases/user/generate-access-link.use-case';
import { InviteUserUseCase } from '../src/application/use-cases/user/invite-user.use-case';
import { ListUserAccessUseCase } from '../src/application/use-cases/user/list-user-access.use-case';
import { RevokeUserSessionsUseCase } from '../src/application/use-cases/user/revoke-user-sessions.use-case';
import { SessionCookieService } from '../src/infrastructure/auth/session-cookie.service';
import { AuditService } from '../src/application/services/audit.service';
import { CommentWriterService } from '../src/application/services/comment-writer.service';
import { ClickupCommentAssembler } from '../src/application/services/compat/clickup-comment-assembler.service';
import { ClickupTaskAssembler } from '../src/application/services/compat/clickup-task-assembler.service';
import { ClickupUserResolver } from '../src/application/services/compat/clickup-user-resolver.service';
import { CustomFieldValidationService } from '../src/application/services/custom-field-validation.service';
import { GuestAccessService } from '../src/application/services/guest-access.service';
import { NotificationService } from '../src/application/services/notification.service';
import { RealtimeService } from '../src/application/services/realtime.service';
import { RecurrenceScheduler } from '../src/application/services/recurrence-scheduler.service';
import { UserProvisioningService } from '../src/application/services/user-provisioning.service';
import { WorkspaceMembersService } from '../src/application/services/workspace-members.service';
import { ConfirmAttachmentUseCase } from '../src/application/use-cases/attachment/confirm-attachment.use-case';
import { DeleteAttachmentUseCase } from '../src/application/use-cases/attachment/delete-attachment.use-case';
import { DownloadAttachmentUseCase } from '../src/application/use-cases/attachment/download-attachment.use-case';
import { ListAttachmentsUseCase } from '../src/application/use-cases/attachment/list-attachments.use-case';
import { RequestUploadUseCase } from '../src/application/use-cases/attachment/request-upload.use-case';
import { DevLoginUseCase } from '../src/application/use-cases/auth/dev-login.use-case';
import { GetMeUseCase } from '../src/application/use-cases/auth/get-me.use-case';
import { LoginAccessUseCase } from '../src/application/use-cases/auth/login-access.use-case';
import { AutomationsUseCase } from '../src/application/use-cases/automation/automations.use-case';
import { ChatUseCase } from '../src/application/use-cases/chat/chat.use-case';
import { CreateCommentUseCase } from '../src/application/use-cases/comment/create-comment.use-case';
import { DeleteCommentUseCase } from '../src/application/use-cases/comment/delete-comment.use-case';
import { EditCommentUseCase } from '../src/application/use-cases/comment/edit-comment.use-case';
import { ListCommentsUseCase } from '../src/application/use-cases/comment/list-comments.use-case';
import { UpsertDailyLogUseCase } from '../src/application/use-cases/comment/upsert-daily-log.use-case';
import { ClickupAttachmentUseCase } from '../src/application/use-cases/compat/clickup-attachment.use-case';
import { ClickupCommentsUseCase } from '../src/application/use-cases/compat/clickup-comments.use-case';
import { ClickupHierarchyUseCase } from '../src/application/use-cases/compat/clickup-hierarchy.use-case';
import { ClickupListTasksUseCase } from '../src/application/use-cases/compat/clickup-list-tasks.use-case';
import { ClickupWriteTaskUseCase } from '../src/application/use-cases/compat/clickup-write-task.use-case';
import { CreateCustomFieldUseCase } from '../src/application/use-cases/custom-field/create-custom-field.use-case';
import { DeleteCustomFieldUseCase } from '../src/application/use-cases/custom-field/delete-custom-field.use-case';
import { ListCustomFieldsUseCase } from '../src/application/use-cases/custom-field/list-custom-fields.use-case';
import { DashboardsUseCase } from '../src/application/use-cases/dashboard/dashboards.use-case';
import { DocsUseCase } from '../src/application/use-cases/doc/docs.use-case';
import { FormsUseCase } from '../src/application/use-cases/form/forms.use-case';
import { GoalsUseCase } from '../src/application/use-cases/goal/goals.use-case';
import { UserGroupsUseCase } from '../src/application/use-cases/group/user-groups.use-case';
import { CreateFolderUseCase } from '../src/application/use-cases/hierarchy/create-folder.use-case';
import { CreateListUseCase } from '../src/application/use-cases/hierarchy/create-list.use-case';
import { CreateSpaceUseCase } from '../src/application/use-cases/hierarchy/create-space.use-case';
import { DeleteFolderUseCase } from '../src/application/use-cases/hierarchy/delete-folder.use-case';
import { DeleteListUseCase } from '../src/application/use-cases/hierarchy/delete-list.use-case';
import { GetHierarchyUseCase } from '../src/application/use-cases/hierarchy/get-hierarchy.use-case';
import { RenameFolderUseCase } from '../src/application/use-cases/hierarchy/rename-folder.use-case';
import { UpdateListUseCase } from '../src/application/use-cases/hierarchy/update-list.use-case';
import { UpdateSpaceUseCase } from '../src/application/use-cases/hierarchy/update-space.use-case';
import { InboxUseCase } from '../src/application/use-cases/inbox/inbox.use-case';

import { ListNotificationsUseCase } from '../src/application/use-cases/notification/list-notifications.use-case';
import { MarkNotificationsReadUseCase } from '../src/application/use-cases/notification/mark-notifications-read.use-case';
import { TaskDependenciesUseCase } from '../src/application/use-cases/planning/task-dependencies.use-case';
import { TaskPlansUseCase } from '../src/application/use-cases/planning/task-plans.use-case';
import { TaskTemplatesUseCase } from '../src/application/use-cases/planning/task-templates.use-case';
import { TimeTrackingUseCase } from '../src/application/use-cases/planning/time-tracking.use-case';
import { SavedViewsUseCase } from '../src/application/use-cases/saved-view/saved-views.use-case';
import { CreateTaskUseCase } from '../src/application/use-cases/task/create-task.use-case';
import { DeleteTaskUseCase } from '../src/application/use-cases/task/delete-task.use-case';
import { GetTaskUseCase } from '../src/application/use-cases/task/get-task.use-case';
import { TaskActivityUseCase } from '../src/application/use-cases/task/task-activity.use-case';
import { ListTasksUseCase } from '../src/application/use-cases/task/list-tasks.use-case';
import { SearchUseCase } from '../src/application/use-cases/task/search.use-case';
import { UpdateTaskUseCase } from '../src/application/use-cases/task/update-task.use-case';
import { CreateApiTokenUseCase } from '../src/application/use-cases/token/create-api-token.use-case';
import { ListApiTokensUseCase } from '../src/application/use-cases/token/list-api-tokens.use-case';
import { RevokeApiTokenUseCase } from '../src/application/use-cases/token/revoke-api-token.use-case';
import { ChangeUserRoleUseCase } from '../src/application/use-cases/user/change-user-role.use-case';
import { ChangeUserStatusUseCase } from '../src/application/use-cases/user/change-user-status.use-case';
import { GuestAccessUseCase } from '../src/application/use-cases/user/guest-access.use-case';
import { ListUsersUseCase } from '../src/application/use-cases/user/list-users.use-case';
import { HandleGithubWebhookUseCase } from '../src/application/use-cases/webhook/handle-github-webhook.use-case';
import { EnvConfigService } from '../src/common/env/services/env-config.service';
import { PrincipalGuard } from '../src/infrastructure/auth/principal.guard';
import { ScopesGuard } from '../src/infrastructure/auth/scopes.guard';
import { CorsService } from '../src/infrastructure/http-security/services/cors.service';
import { AuditLoggerService } from '../src/shared/observability/audit-logger.service';

const PROVIDERS = [
  AuditService,
  CommentWriterService,
  ClickupCommentAssembler,
  ClickupTaskAssembler,
  ClickupUserResolver,
  CustomFieldValidationService,
  GuestAccessService,
  NotificationService,
  RealtimeService,
  RecurrenceScheduler,
  UserProvisioningService,
  WorkspaceMembersService,
  ConfirmAttachmentUseCase,
  DeleteAttachmentUseCase,
  DownloadAttachmentUseCase,
  ListAttachmentsUseCase,
  RequestUploadUseCase,
  DevLoginUseCase,
  AccessLinkService,
  LoginThrottleService,
  ChangePasswordUseCase,
  CheckAccessLinkUseCase,
  ForgotPasswordUseCase,
  ListSessionsUseCase,
  LogoutUseCase,
  PasswordLoginUseCase,
  RevokeSessionUseCase,
  SetPasswordUseCase,
  GenerateAccessLinkUseCase,
  InviteUserUseCase,
  ListUserAccessUseCase,
  RevokeUserSessionsUseCase,
  SessionCookieService,
  GetMeUseCase,
  LoginAccessUseCase,
  AutomationsUseCase,
  ChatUseCase,
  CreateCommentUseCase,
  DeleteCommentUseCase,
  EditCommentUseCase,
  ListCommentsUseCase,
  UpsertDailyLogUseCase,
  ClickupAttachmentUseCase,
  ClickupCommentsUseCase,
  ClickupHierarchyUseCase,
  ClickupListTasksUseCase,
  ClickupWriteTaskUseCase,
  CreateCustomFieldUseCase,
  DeleteCustomFieldUseCase,
  ListCustomFieldsUseCase,
  DashboardsUseCase,
  DocsUseCase,
  FormsUseCase,
  GoalsUseCase,
  UserGroupsUseCase,
  CreateFolderUseCase,
  CreateListUseCase,
  CreateSpaceUseCase,
  DeleteFolderUseCase,
  DeleteListUseCase,
  GetHierarchyUseCase,
  RenameFolderUseCase,
  UpdateListUseCase,
  UpdateSpaceUseCase,
  InboxUseCase,
  ListNotificationsUseCase,
  MarkNotificationsReadUseCase,
  TaskDependenciesUseCase,
  TaskPlansUseCase,
  TaskTemplatesUseCase,
  TimeTrackingUseCase,
  SavedViewsUseCase,
  CreateTaskUseCase,
  DeleteTaskUseCase,
  GetTaskUseCase,
  TaskActivityUseCase,
  ListTasksUseCase,
  SearchUseCase,
  UpdateTaskUseCase,
  CreateApiTokenUseCase,
  ListApiTokensUseCase,
  RevokeApiTokenUseCase,
  ChangeUserRoleUseCase,
  ChangeUserStatusUseCase,
  GuestAccessUseCase,
  ListUsersUseCase,
  HandleGithubWebhookUseCase,
  EnvConfigService,
  PrincipalGuard,
  ScopesGuard,
  CorsService,
  AuditLoggerService,
];

describe('Provider wiring (e2e)', () => {
  let ctx: TestContext;
  let app: INestApplication;

  beforeAll(async () => {
    ctx = await createTestApp();
    app = ctx.app;
  });

  afterAll(async () => {
    await app.close();
    await ctx.mongod.stop();
  });

  it.each(PROVIDERS.map(provider => [provider.name, provider] as const))('%s is resolvable from the application container', (_name, provider) => {
    const instance = app.get(provider, { strict: false });
    expect(instance).toBeInstanceOf(provider);
  });
});
