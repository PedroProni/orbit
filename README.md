# Orbit

A self-hosted task manager built as a ClickUp replacement: spaces, folders, lists and sprints, a fast board and list, saved views, an "All tasks" board across every space, and a ClickUp importer.

## Highlights

- **Board and list like ClickUp:** inline "+" composer at the top of each column and group, with assignee, dates, priority and tags as chips; Enter saves and keeps the composer open for the next task.
- **Quick creation window** with `/` commands (assign, follower, subtask, move, template), checklists and dependencies.
- **All tasks:** one board and table with every task the user can see, grouped by status, with the source list on each card.
- **Assignee quick filter** with counts per person, "Unassigned" and a one-click "Me".
- **Saved views:** create, rename, share and duplicate per list.
- **Admin area:** spaces, folders, lists, sprints, locked default statuses plus extra statuses, rules for new tasks, groups and task types.
- **Own login:** email and password, single-use invite links, revocable sessions, login throttling.
- **Guests:** read-only access to shared lists only; inline images visible only when the task text shows them.
- **GitHub:** pull requests linked to tasks by id in the branch or PR title.
- **ClickUp importer:** copies spaces, lists, statuses, tasks, comments and custom fields.
- **English and Portuguese**, light and dark themes, works on mobile.

## Stack

| Part | Folder | Tech |
| --- | --- | --- |
| API | `api/` | NestJS, TypeScript, MongoDB, S3-compatible storage (MinIO locally), clean architecture |
| Web | `web/` | Next.js, React, TypeScript, next-intl, Vitest |

## Run locally

```bash
cd api && docker compose up -d
cd application && cp .env.example .env && npm install && npm run start:dev
cd ../../web && npm install && npm run dev
```

The API listens on `http://localhost:3000` and the web app on `http://localhost:3001`.

## Tests

```bash
cd api/application && npm test && npm run test:e2e
cd web && npx vitest run
```

## License

All rights reserved.
