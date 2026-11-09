import { TaskPriority } from '@domain/enums/task.enums';
import { TaskCustomFieldValue } from '@domain/types/task-custom-field-value.type';
import { Checklist } from '@domain/types/checklist.type';
import { TaskEntityProps } from '@domain/props/task-entity.props';
import { TaskLinks } from '@domain/types/task-links.type';
import { TaskLinksPolicy } from '@domain/policies/task-links.policy';

export class TaskEntity {
  private readonly _id: string;
  private workspaceId: string;
  private spaceId: string;
  private listId: string;
  private parentId: string | null;
  private title: string;
  private descriptionMd: string;
  private status: string;
  private priority: TaskPriority | null;
  private tags: string[];
  private assigneeIds: string[];
  private watcherIds: string[];
  private points: number | null;
  private startDate: Date | null;
  private dueDate: Date | null;
  private customFields: TaskCustomFieldValue[];
  private links: TaskLinks;
  private checklists: Checklist[];
  private creatorId: string;
  private dateClosed: Date | null;
  private archived: boolean;
  private clickupId: string | null;
  private readonly createdAt: Date;
  private updatedAt: Date;

  constructor(props: TaskEntityProps) {
    this._id = props._id;
    this.workspaceId = props.workspaceId;
    this.spaceId = props.spaceId;
    this.listId = props.listId;
    this.parentId = props.parentId;
    this.title = props.title;
    this.descriptionMd = props.descriptionMd;
    this.status = props.status;
    this.priority = props.priority;
    this.tags = props.tags;
    this.assigneeIds = props.assigneeIds;
    this.watcherIds = props.watcherIds;
    this.points = props.points;
    this.startDate = props.startDate;
    this.dueDate = props.dueDate;
    this.customFields = props.customFields;
    this.links = TaskLinksPolicy.normalize(props.links);
    this.checklists = props.checklists;
    this.creatorId = props.creatorId;
    this.dateClosed = props.dateClosed;
    this.archived = props.archived;
    this.clickupId = props.clickupId;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  getId(): string {
    return this._id;
  }

  getWorkspaceId(): string {
    return this.workspaceId;
  }

  getSpaceId(): string {
    return this.spaceId;
  }

  getListId(): string {
    return this.listId;
  }

  getParentId(): string | null {
    return this.parentId;
  }

  getTitle(): string {
    return this.title;
  }

  getDescriptionMd(): string {
    return this.descriptionMd;
  }

  getStatus(): string {
    return this.status;
  }

  getPriority(): TaskPriority | null {
    return this.priority;
  }

  getTags(): string[] {
    return this.tags;
  }

  getAssigneeIds(): string[] {
    return this.assigneeIds;
  }

  getWatcherIds(): string[] {
    return this.watcherIds;
  }

  getPoints(): number | null {
    return this.points;
  }

  getStartDate(): Date | null {
    return this.startDate;
  }

  getDueDate(): Date | null {
    return this.dueDate;
  }

  getCustomFields(): TaskCustomFieldValue[] {
    return this.customFields;
  }

  getLinks(): TaskLinks {
    return this.links;
  }

  setLinks(patch: Partial<TaskLinks>): void {
    this.links = TaskLinksPolicy.merge(this.links, patch);
    this.updatedAt = new Date();
  }

  getChecklists(): Checklist[] {
    return this.checklists;
  }

  getCreatorId(): string {
    return this.creatorId;
  }

  getDateClosed(): Date | null {
    return this.dateClosed;
  }

  getArchived(): boolean {
    return this.archived;
  }

  getClickupId(): string | null {
    return this.clickupId;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  changeTitle(title: string): void {
    if (!title || title.trim().length === 0) throw new Error('Title cannot be empty');
    if (title.length > 500) throw new Error('Title is too long');
    this.title = title.trim();
    this.updatedAt = new Date();
  }

  changeDescription(descriptionMd: string): void {
    this.descriptionMd = descriptionMd;
    this.updatedAt = new Date();
  }

  changeStatus(status: string, closed: boolean): void {
    this.status = status;
    this.dateClosed = closed ? (this.dateClosed ?? new Date()) : null;
    this.updatedAt = new Date();
  }

  changePriority(priority: TaskPriority | null): void {
    this.priority = priority;
    this.updatedAt = new Date();
  }

  replaceTags(tags: string[]): void {
    this.tags = [...new Set(tags.map(t => t.trim().toLowerCase()).filter(Boolean))];
    this.updatedAt = new Date();
  }

  replaceAssignees(assigneeIds: string[]): void {
    this.assigneeIds = [...new Set(assigneeIds)];
    this.updatedAt = new Date();
  }

  replaceWatchers(watcherIds: string[]): void {
    this.watcherIds = [...new Set(watcherIds)];
    this.updatedAt = new Date();
  }

  addWatcher(userId: string): void {
    if (!this.watcherIds.includes(userId)) this.watcherIds = [...this.watcherIds, userId];
  }

  changePoints(points: number | null): void {
    if (points !== null && (Number.isNaN(points) || points < 0)) throw new Error('Points must be zero or positive');
    this.points = points;
    this.updatedAt = new Date();
  }

  changeDates(startDate: Date | null, dueDate: Date | null): void {
    if (startDate && dueDate && dueDate.getTime() < startDate.getTime()) throw new Error('Due date must not be before start date');
    this.startDate = startDate;
    this.dueDate = dueDate;
    this.updatedAt = new Date();
  }

  replaceCustomFields(values: TaskCustomFieldValue[]): void {
    this.customFields = values;
    this.updatedAt = new Date();
  }

  replaceChecklists(checklists: Checklist[]): void {
    this.checklists = checklists;
    this.updatedAt = new Date();
  }

  moveToList(listId: string, spaceId: string, status: string, closed: boolean): void {
    this.listId = listId;
    this.spaceId = spaceId;
    this.status = status;
    this.dateClosed = closed ? (this.dateClosed ?? new Date()) : null;
    this.updatedAt = new Date();
  }

  setArchived(archived: boolean): void {
    this.archived = archived;
    this.updatedAt = new Date();
  }

  hasTag(tag: string): boolean {
    return this.tags.includes(tag.toLowerCase());
  }

  toProps(): TaskEntityProps {
    return {
      _id: this._id,
      workspaceId: this.workspaceId,
      spaceId: this.spaceId,
      listId: this.listId,
      parentId: this.parentId,
      title: this.title,
      descriptionMd: this.descriptionMd,
      status: this.status,
      priority: this.priority,
      tags: this.tags,
      assigneeIds: this.assigneeIds,
      watcherIds: this.watcherIds,
      points: this.points,
      startDate: this.startDate,
      dueDate: this.dueDate,
      customFields: this.customFields,
      links: this.links,
      checklists: this.checklists,
      creatorId: this.creatorId,
      dateClosed: this.dateClosed,
      archived: this.archived,
      clickupId: this.clickupId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
