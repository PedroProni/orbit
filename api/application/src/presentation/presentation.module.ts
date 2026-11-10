import { Module } from '@nestjs/common';
import { ApplicationModule } from '@application/application.module';
import { AuthModule } from '@infrastructure/auth/auth.module';
import { AuthController } from '@presentation/controllers/auth.controllers';
import { UserController } from '@presentation/controllers/user.controllers';
import { ApiTokenController } from '@presentation/controllers/api-token.controllers';

import { HierarchyController } from '@presentation/controllers/hierarchy.controllers';
import { CustomFieldController } from '@presentation/controllers/custom-field.controllers';

import { TaskController } from '@presentation/controllers/task.controllers';

import { CommentController } from '@presentation/controllers/comment.controllers';
import { NotificationController } from '@presentation/controllers/notification.controllers';

import { AttachmentController } from '@presentation/controllers/attachment.controllers';

import { SearchController } from '@presentation/controllers/search.controllers';

import { ClickupCompatController } from '@presentation/controllers/compat/clickup-compat.controllers';

import { GithubWebhookController } from '@presentation/controllers/github-webhook.controllers';
import { TaskPullRequestController } from '@presentation/controllers/task-pull-request.controllers';
import { TaskGithubController } from '@presentation/controllers/task-github.controllers';

import { SavedViewController } from '@presentation/controllers/saved-view.controllers';

import { PlanningController } from '@presentation/controllers/planning.controllers';
import { DocController, GoalController, DashboardController } from '@presentation/controllers/knowledge.controllers';
import { AutomationController } from '@presentation/controllers/automation.controller';
import { AuditLogController } from '@presentation/controllers/audit-log.controllers';
import { GithubIntegrationController } from '@presentation/controllers/github-integration.controllers';
import { WorkspaceController } from '@presentation/controllers/workspace.controllers';
import { FormController, PublicFormController, ChatController, UserGroupController, GuestAccessController, InboxController } from '@presentation/controllers/workspace-extras.controllers';
const controllers: any = [
  AuthController,
  UserController,
  ApiTokenController,
  HierarchyController,
  CustomFieldController,
  TaskController,
  TaskPullRequestController,
  TaskGithubController,
  CommentController,
  NotificationController,
  AttachmentController,
  SearchController,
  ClickupCompatController,
  GithubWebhookController,
  GithubIntegrationController,
  AuditLogController,
  WorkspaceController,
  SavedViewController,
  PlanningController,
  DocController,
  GoalController,
  DashboardController,
  FormController,
  PublicFormController,
  AutomationController,
  ChatController,
  UserGroupController,
  GuestAccessController,
  InboxController,
];

@Module({
  imports: [ApplicationModule, AuthModule],
  controllers: [...controllers],
})
export class PresentationModule {}
