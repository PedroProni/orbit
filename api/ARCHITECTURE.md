# DDD Template - Architecture Guide for AI Agents

This document is a complete guide for AI agents (Claude, GPT, Copilot, etc.) to generate new domains, features, and services following this project's architecture. Read this entire file before generating any code.

---

## TL;DR

- **Stack:** NestJS 11 · TypeScript (strict) · MongoDB/Mongoose · AWS CloudWatch Metrics · Jest + Supertest
- **Entry point:** `application/src/main.ts`
- **Layer order (dependency direction →):** Domain → Application → Infrastructure / Presentation / Shared
- **Domain layer is pure TypeScript** - no NestJS imports allowed.
- **To add a new domain:** follow the step-by-step in Section 3 (Domain → Infrastructure → Application → Shared → Presentation → Observability → Tests).

---

## 1. Project Overview

This is a **NestJS** backend template following **Domain-Driven Design (DDD)** with **Clean Architecture**. It enforces strict separation of concerns:

- **Domain** knows nothing about infrastructure or frameworks.
- **Application** orchestrates domain logic via use cases and commands.
- **Infrastructure** implements persistence, auth, health, docs, and observability.
- **Presentation** exposes HTTP endpoints.
- **Shared** holds DTOs, interfaces, and cross-cutting concerns.

**Tech stack:** NestJS 11, TypeScript (strict), MongoDB/Mongoose, AWS Embedded Metrics (CloudWatch), Jest + Supertest for E2E tests.

---

## 2. Folder Structure

```
application/src/
├── main.ts                          # App bootstrap, pipes, CORS, Swagger, shutdown hooks
├── app.module.ts                    # Root module - imports all top-level modules
│
├── domain/                          # PURE DOMAIN - no framework imports allowed
│   ├── domain.module.ts             # Binds inject tokens to persistence implementations
│   ├── entities/                    # One file per entity
│   │   └── example.entity.ts        # Entity class with private fields, getters, domain methods
│   ├── enums/                       # Domain enums
│   │   └── example.enums.ts
│   ├── errors/                      # Domain-specific error classes
│   │   └── domain.error.ts          # Base DomainError(code, message, status, context)
│   ├── mappers/                     # Domain mappers (entity <-> persistence)
│   │   └── example.mapper.ts        # DomainExampleMapper: toPersistence(), toDomain()
│   ├── props/                       # Entity constructor interfaces
│   │   └── example-entity.props.ts
│   ├── repositories/                # Repository interfaces (contracts)
│   │   └── example.repository.ts    # ExampleRepository interface + PaginatedResult<T>
│   └── tokens/                      # Dependency injection tokens
│       └── inject.token.ts          # Symbol tokens for repository injection
│
├── application/                     # USE CASES - orchestration layer
│   ├── application.module.ts        # Imports DomainModule, exports all use cases
│   ├── commands/                    # Command objects (input DTOs for use cases)
│   │   ├── example/
│   │   │   ├── create-example.command.ts
│   │   │   └── update-example.command.ts
│   │   └── export-all.commands.ts   # Barrel export
│   ├── mappers/                     # Application mappers (DTO -> Command, Command -> Entity)
│   │   └── example.mapper.ts        # ApplicationExampleMapper
│   └── use-cases/                   # One class per use case
│       ├── example/
│       │   ├── create-example.use-case.ts
│       │   ├── find-example.use-case.ts
│       │   ├── update-example.use-case.ts
│       │   └── delete-example.use-case.ts
│       └── export-all.use-cases.ts  # Barrel export
│
├── infrastructure/                  # FRAMEWORK & EXTERNAL CONCERNS
│   ├── infrastructure.module.ts     # Imports all infra sub-modules
│   ├── auth/
│   │   ├── principal.guard.ts       # PrincipalGuard - session cookie, Bearer session or API token
│   │   ├── scopes.guard.ts          # ScopesGuard - checks the scopes of the route
│   │   ├── authenticated.decorator.ts # @Authenticated(...scopes)
│   │   └── auth.module.ts
│   ├── database/
│   │   ├── database.module.ts       # Registers schemas + persistence providers
│   │   ├── connection/
│   │   │   └── mongo-connect.module.ts
│   │   ├── persistence/             # Repository implementations
│   │   │   └── example.persistence.ts
│   │   └── schemas/                 # Mongoose schemas
│   │       └── example.schema.ts
│   ├── documentation/               # Swagger setup
│   │   ├── swagger.ts
│   │   ├── config/
│   │   │   ├── swagger-constants.config.ts
│   │   │   ├── swagger-tags.config.ts
│   │   │   ├── swagger.config.ts
│   │   │   └── description.txt
│   │   └── examples/
│   │       └── app_documentation/
│   │           └── example-swagger.decorator.ts
│   ├── health/
│   │   ├── health.module.ts
│   │   └── controllers/
│   │       └── health.controller.ts # GET /health - MongoDB ping
│   ├── http-security/
│   │   ├── http-security.module.ts
│   │   └── services/
│   │       └── cors.service.ts
│   └── middlewares/
│       └── swagger-auth.middleware.ts
│
├── presentation/                    # HTTP CONTROLLERS
│   ├── presentation.module.ts       # Imports ApplicationModule, declares controllers
│   └── controllers/
│       └── example.controllers.ts   # REST endpoints with guards, decorators, DTOs
│
├── shared/                          # CROSS-CUTTING
│   ├── dtos/                        # Request/response DTOs with class-validator
│   │   ├── example/
│   │   │   ├── create-example.dto.ts
│   │   │   ├── update-example.dto.ts
│   │   │   └── find-example.dto.ts
│   │   └── export-all.dto.ts        # Barrel export
│   ├── interfaces/
│   │   └── env-config.interface.ts
│   ├── filters/
│   │   └── global-exception.filter.ts  # Catches all exceptions, returns structured JSON
│   └── observability/
│       ├── observability.module.ts     # Global module: interceptors, middleware, filter
│       ├── request-id.middleware.ts    # Generates UUID request IDs
│       ├── request-logging.interceptor.ts  # Structured HTTP logging to stdout
│       ├── metrics.interceptor.ts     # AWS CloudWatch metrics via aws-embedded-metrics
│       ├── audit-logger.service.ts    # Injectable structured JSON audit logger
│       └── route-tiers.config.ts      # Route tier classification for p95 thresholds
│
├── common/
│   ├── env/
│   │   ├── env-config.module.ts     # Global ConfigModule
│   │   └── services/
│   │       └── env-config.service.ts
│   └── helpers/
│       ├── helper.module.ts
│       └── functions/
│           └── example.helper.ts
│
└── test/
    ├── jest-e2e.json                # E2E Jest config with path alias support
    └── app.e2e-spec.ts              # Full CRUD + auth + domain rules + error format tests
```

---

## 3. Path Aliases

The project uses TypeScript path aliases (defined in `application/tsconfig.json`). Always use these aliases in imports - never use relative paths across layers.

| Alias | Maps to |
|-------|---------|
| `@domain/*` | `src/domain/*` |
| `@application/*` | `src/application/*` |
| `@infrastructure/*` | `src/infrastructure/*` |
| `@presentation/*` | `src/presentation/*` |
| `@shared/*` | `src/shared/*` |
| `@common/*` | `src/common/*` |

---

## 4. Environment Variables

All environment variables are accessed through `EnvConfigService` (`common/env/services/env-config.service.ts`), which wraps NestJS's `ConfigService`. Direct `process.env` access is only used in `main.ts` and a few shared filters/services.

The full list of variables, with what each one does, the value the code uses when it is missing and the value in `application/.env.example`, is the table in [README.md, "Variáveis de ambiente"](README.md#variáveis-de-ambiente). Keep that table as the single source when a variable is added or changed.

---

## 5. How to Add a New Domain (Step-by-Step)

When adding a new domain (e.g., `product`), follow these steps **in this order**. After implementation is complete, see [Appendix A](#appendix-a--removing-example-scaffolding) for cleanup.

### Step 1: Domain Layer (Pure Business Logic)

**No NestJS imports in this layer. Only TypeScript.**

1. **Create the enum** at `src/domain/enums/product.enums.ts`:
   ```typescript
   export enum ProductStatus {
     DRAFT = 'draft',
     ACTIVE = 'active',
     ARCHIVED = 'archived',
   }
   ```

2. **Create the props interface** at `src/domain/props/product-entity.props.ts`:
   ```typescript
   import { ProductStatus } from '@domain/enums/product.enums';

   export interface ProductEntityProps {
     _id: string;
     name: string;
     price: number;
     status: ProductStatus;
     createdAt: Date;
     updatedAt: Date;
   }
   ```

3. **Create the entity** at `src/domain/entities/product.entity.ts`:
   - Private fields, constructor from props interface
   - Getters for all fields
   - **Domain methods** for mutations (e.g., `changePrice()`, `activate()`, `archive()`)
   - Domain methods must enforce business rules and throw `Error` on violations
   - Always update `this.updatedAt = new Date()` on mutations
   ```typescript
   import { ProductStatus } from '@domain/enums/product.enums';
   import { ProductEntityProps } from '@domain/props/product-entity.props';

   export class ProductEntity {
     private readonly _id: string;
     private name: string;
     private price: number;
     private status: ProductStatus;
     private readonly createdAt: Date;
     private updatedAt: Date;

     constructor(props: ProductEntityProps) {
       this._id = props._id;
       this.name = props.name;
       this.price = props.price;
       this.status = props.status;
       this.createdAt = props.createdAt;
       this.updatedAt = props.updatedAt;
     }

     // Getters
     getId(): string { return this._id; }
     getName(): string { return this.name; }
     getPrice(): number { return this.price; }
     getStatus(): ProductStatus { return this.status; }
     getCreatedAt(): Date { return this.createdAt; }
     getUpdatedAt(): Date { return this.updatedAt; }

     // Domain methods - enforce business rules here
     changePrice(newPrice: number): void {
       if (newPrice < 0) throw new Error('Price cannot be negative');
       if (this.status === ProductStatus.ARCHIVED) throw new Error('Cannot change price of archived product');
       this.price = newPrice;
       this.updatedAt = new Date();
     }

     activate(): void {
       if (this.status !== ProductStatus.DRAFT) throw new Error('Only draft products can be activated');
       this.status = ProductStatus.ACTIVE;
       this.updatedAt = new Date();
     }

     archive(): void {
       if (this.status === ProductStatus.ARCHIVED) throw new Error('Product is already archived');
       this.status = ProductStatus.ARCHIVED;
       this.updatedAt = new Date();
     }
   }
   ```

4. **Create the repository interface** at `src/domain/repositories/product.repository.ts`:
   > **Note:** `PaginatedResult<T>` is a shared type used by all repositories. It is currently defined in `domain/repositories/example.repository.ts`. If you are removing the example domain, extract it to `domain/repositories/paginated-result.ts` first.
   ```typescript
   import { ProductEntity } from '@domain/entities/product.entity';
   import { PaginatedResult } from '@domain/repositories/paginated-result';

   export interface ProductRepository {
     create(entity: ProductEntity): Promise<ProductEntity>;
     find(page: number, limit: number): Promise<PaginatedResult<ProductEntity>>;
     findById(id: string): Promise<ProductEntity | null>;
     update(entity: ProductEntity): Promise<ProductEntity>;
     delete(id: string): Promise<void>;
   }
   ```

5. **Create the domain mapper** at `src/domain/mappers/product.mapper.ts`:
   ```typescript
   import { ProductEntity } from '@domain/entities/product.entity';

   export class DomainProductMapper {
     static toPersistence(entity: ProductEntity): any {
       return {
         _id: entity.getId(),
         name: entity.getName(),
         price: entity.getPrice(),
         status: entity.getStatus(),
         created_at: entity.getCreatedAt(),
         updated_at: entity.getUpdatedAt(),
       };
     }

     static toDomain(raw: any): ProductEntity {
       return new ProductEntity({
         _id: raw._id,
         name: raw.name,
         price: raw.price,
         status: raw.status,
         createdAt: raw.created_at ?? raw.createdAt,
         updatedAt: raw.updated_at ?? raw.updatedAt,
       });
     }
   }
   ```

6. **Add the inject token** to `src/domain/tokens/inject.token.ts`:
   ```typescript
   export const PRODUCT_INJECT_TOKEN = Symbol('PRODUCT_INJECT_TOKEN');
   ```

7. **Register in domain.module.ts** - add the token binding:
   ```typescript
   {
     provide: PRODUCT_INJECT_TOKEN,
     useExisting: ProductPersistence,
   }
   ```

### Step 2: Infrastructure Layer (Persistence)

8. **Create the Mongoose schema** at `src/infrastructure/database/schemas/product.schema.ts`:
   - Use `@Prop({ index: true })` on fields you query/filter by
   - Use `timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }` to match mapper convention
   - Set `versionKey: false`

9. **Create the persistence** at `src/infrastructure/database/persistence/product.persistence.ts`:
   - Implements `ProductRepository`
   - Uses `DomainProductMapper` for all conversions
   - `find()` must return `PaginatedResult<T>` with `data`, `total`, `page`, `limit`, `totalPages`

10. **Register in database.module.ts** - add schema to `MongooseModule.forFeature` and persistence to providers/exports.

### Step 3: Application Layer (Use Cases)

11. **Create commands** at `src/application/commands/product/`:
    - `create-product.command.ts`
    - `update-product.command.ts`
    - Add exports to `export-all.commands.ts`

12. **Create the application mapper** at `src/application/mappers/product.mapper.ts`:
    - `toCreateCommand(dto)` - generates UUID, timestamps
    - `toUpdateCommand(id, dto)` - wraps partial update
    - `toEntity(command)` - creates entity from command

13. **Create use cases** at `src/application/use-cases/product/`:
    - One file per operation: `create-product.use-case.ts`, `find-product.use-case.ts`, etc.
    - Inject repository via `@Inject(PRODUCT_INJECT_TOKEN)`
    - **Update use case** must: fetch entity, call entity domain methods (`entity.update()`), then persist
    - **Do NOT** wrap in generic try/catch - let the global exception filter handle errors
    - Throw `NotFoundException` for missing entities, `BadRequestException` for domain rule violations
    - Add exports to `export-all.use-cases.ts`

14. **Register in application.module.ts** - add use cases to providers and exports.

### Step 4: Shared Layer (DTOs)

15. **Create DTOs** at `src/shared/dtos/product/`:
    - `create-product.dto.ts` - use `@IsString()`, `@IsNumber()`, `@IsEnum()` etc.
    - `update-product.dto.ts` - all fields `@IsOptional()`
    - `find-product.dto.ts` - response shape for Swagger
    - Add exports to `export-all.dto.ts`

### Step 5: Presentation Layer (Controller)

16. **Create the controller** at `src/presentation/controllers/product.controllers.ts`:
    - `@Authenticated(SCOPE_...)` for protected routes (session cookie, Bearer session or API token, plus the scopes of the route)
    - `@ApiTags('Product')` for Swagger grouping
    - Inject use cases in constructor
    - Use application mapper in each endpoint: `ApplicationProductMapper.toCreateCommand(dto)`
    - Standard HTTP codes: POST=201, GET=200, PUT=200, DELETE=204

17. **Register in presentation.module.ts** - add controller.

18. **Add Swagger tag** in `swagger-tags.config.ts`.

19. **Create Swagger decorators** at `src/infrastructure/documentation/examples/app_documentation/product-swagger.decorator.ts`.

### Step 6: Add route tiers for observability

20. **Update `route-tiers.config.ts`** - add your new routes with appropriate tiers and p95 thresholds.

### Step 7: E2E Tests

21. **Add tests to `test/app.e2e-spec.ts`** or create a new `test/product.e2e-spec.ts`:
    - Test auth rejection (no token, wrong token)
    - Test full CRUD (create, read, update, delete)
    - Test validation (missing fields, invalid enum, extra fields)
    - Test domain rules (invalid state transitions, business rule violations)
    - Test 404 on non-existent resources
    - Test paginated response shape

---

## 6. Data Flow - How a Request Travels

```
HTTP Request
  → RequestIdMiddleware (assigns UUID)
  → PrincipalGuard (session or API token) + ScopesGuard (route scopes)
  → Controller (parses input)
  → ApplicationMapper.toCommand(dto)
  → UseCase.execute(command)
    → Repository.findById() [if update/delete]
    → Entity.domainMethod() [applies business rules]
    → Repository.create/update/delete()
    → DomainMapper.toDomain(dbDoc)
  → Response
  ← RequestLoggingInterceptor (logs request/response)
  ← MetricsInterceptor (emits CloudWatch metrics)

On error at any level:
  → GlobalExceptionFilter catches it
  → Returns structured JSON: { statusCode, message, timestamp, path, requestId }
  → Logs structured JSON to stdout for CloudWatch
```

---

## 7. Key Rules

### SOLID Principles Applied

| Principle | How it's enforced |
|-----------|-------------------|
| **S** - Single Responsibility | Each file does ONE thing: entity, use case, mapper, schema, controller |
| **O** - Open/Closed | New domains are added without modifying existing ones (except barrel exports and module registrations) |
| **L** - Liskov Substitution | Repository interfaces allow swapping persistence (Mongo -> Postgres) without touching domain |
| **I** - Interface Segregation | Small, focused interfaces: `ExampleRepository`, `IEnvConfig`, `PaginatedResult<T>` |
| **D** - Dependency Inversion | Domain defines repository interfaces; Infrastructure implements them; wired via `Symbol` tokens |

### DDD Rules

- **Entities are the single source of truth** for business rules. Never bypass an entity's domain methods.
- **Entities never import from infrastructure or NestJS.** Only standard TypeScript.
- **All state mutations go through domain methods** that validate invariants.
- **Repositories are interfaces** in the domain layer; implementations live in infrastructure.
- **Commands are immutable value objects** that carry data from DTOs to use cases.

### Mapper Convention

There are **two mapper levels** - never skip or merge them:

| Mapper | Location | Responsibility |
|--------|----------|---------------|
| `ApplicationMapper` | `application/mappers/` | DTO → Command, Command → Entity (generates IDs, timestamps) |
| `DomainMapper` | `domain/mappers/` | Entity → Persistence (snake_case), Persistence → Entity (camelCase) |

### Naming Convention

| Type | Pattern | Example |
|------|---------|---------|
| Entity | `{Name}Entity` | `ProductEntity` |
| Props | `{Name}EntityProps` | `ProductEntityProps` |
| Repository Interface | `{Name}Repository` | `ProductRepository` |
| Persistence | `{Name}Persistence` | `ProductPersistence` |
| Use Case | `{Verb}{Name}UseCase` | `CreateProductUseCase` |
| Command | `{Verb}{Name}Command` | `CreateProductCommand` |
| DTO | `{Verb}{Name}Dto` | `CreateProductDto` |
| Controller | `{Name}Controller` | `ProductController` |
| Schema | `{Name}` (Mongoose class) | `Product` |
| Inject Token | `{NAME}_INJECT_TOKEN` | `PRODUCT_INJECT_TOKEN` |
| Domain Mapper | `Domain{Name}Mapper` | `DomainProductMapper` |
| App Mapper | `Application{Name}Mapper` | `ApplicationProductMapper` |

### File Naming

- One entity per file: `product.entity.ts`
- One use case per file: `create-product.use-case.ts`
- One command per file: `create-product.command.ts`
- One DTO per file: `create-product.dto.ts`
- One schema per file: `product.schema.ts`
- One persistence per file: `product.persistence.ts`
- Controllers can group related endpoints: `product.controllers.ts`

---

## 8. Observability - Where to Add Logs

### Automatic (no code needed)
- **Every HTTP request/response** is logged by `RequestLoggingInterceptor` with: requestId, method, path, statusCode, durationMs
- **Every error** is logged by `GlobalExceptionFilter` with structured JSON
- **CloudWatch metrics** are emitted by `MetricsInterceptor` for: latency, request count, 4xx/5xx rates

### Where to add manual logging
Inject `AuditLoggerService` into use cases or services that need audit trails:

```typescript
constructor(
  private readonly audit: AuditLoggerService,
) {}

// In a use case:
async execute(command: CreateProductCommand): Promise<ProductEntity> {
  const entity = ApplicationProductMapper.toEntity(command);
  const result = await this.productRepository.create(entity);

  this.audit.info('product', 'PRODUCT_CREATED', {
    productId: result.getId(),
    name: result.getName(),
    price: result.getPrice(),
  });

  return result;
}
```

**When to add audit logs:**
- After successful mutations (create, update, delete)
- On business-critical operations (payments, auth events)
- When calling external APIs (log request/response metadata, not bodies)
- On error recovery paths (retries, fallbacks)

**Log levels:**
- `audit.info(domain, event, ctx)` - successful operations
- `audit.warn(domain, event, ctx)` - suspicious or degraded behavior
- `audit.error(domain, event, ctx, error?)` - failures

### Route Tiers for CloudWatch Alerts

Update `route-tiers.config.ts` to classify your routes:

| Tier | Use for | p95 Target |
|------|---------|-----------|
| `TIER_1` - Realtime | Webhooks, critical callbacks | 200ms |
| `TIER_2` - User Facing | Login, CRUD, core features | 500ms |
| `TIER_3` - Important | Reports, history, settings | 1000ms |
| `UNCLASSIFIED` | Default for unmapped routes | - |

---

## 9. E2E Testing Guide

Tests use `mongodb-memory-server` - no external MongoDB needed.

### Test file structure

```typescript
import { MongoMemoryServer } from 'mongodb-memory-server';

describe('Product E2E', () => {
  let app: INestApplication;
  let mongod: MongoMemoryServer;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongod.getUri();
    // ... create app, init
  });

  afterAll(async () => {
    await connection.dropDatabase();
    await app.close();
    await mongod.stop();
  });
});
```

### What to test (checklist for every domain)

- [ ] **Auth**: requests without token → 401
- [ ] **Auth**: requests with wrong token → 401
- [ ] **Auth**: Bearer format works
- [ ] **Create**: valid payload → 201 with correct body
- [ ] **Create**: missing required field → 400
- [ ] **Create**: invalid enum value → 400
- [ ] **Create**: extra fields rejected (whitelist) → 400
- [ ] **Read**: returns paginated shape (data, total, page, limit, totalPages)
- [ ] **Read**: filter by ID works
- [ ] **Read**: pagination params respected
- [ ] **Update**: valid partial update → 200
- [ ] **Update**: domain rule violation → 400 (e.g., invalid status transition)
- [ ] **Update**: non-existent ID → 404
- [ ] **Delete**: existing resource → 204
- [ ] **Delete**: non-existent ID → 404
- [ ] **Error format**: all errors have `statusCode`, `timestamp`, `path`, `requestId`

---

## 10. Module Registration Checklist

When you create a new domain, you need to touch these module files:

| File | What to add |
|------|-------------|
| `domain/tokens/inject.token.ts` | New `Symbol` token |
| `domain/domain.module.ts` | Token → Persistence binding |
| `infrastructure/database/database.module.ts` | Schema registration + Persistence provider |
| `application/commands/export-all.commands.ts` | Barrel export for new commands |
| `application/use-cases/export-all.use-cases.ts` | Barrel export for new use cases |
| `shared/dtos/export-all.dto.ts` | Barrel export for new DTOs |
| `presentation/presentation.module.ts` | New controller |
| `infrastructure/documentation/config/swagger-tags.config.ts` | New Swagger tag |
| `shared/observability/route-tiers.config.ts` | New route tier mappings |

---

## 11. Common Mistakes to Avoid

1. **Do NOT import NestJS decorators in domain entities** - entities are pure TypeScript classes.
2. **Do NOT create entities directly in controllers** - always go through ApplicationMapper → Command → UseCase.
3. **Do NOT mutate entity fields directly** - always use domain methods that enforce business rules.
4. **Do NOT catch errors in use cases just to rethrow** - let the global exception filter handle them. Only catch when you need to translate (e.g., domain Error → BadRequestException).
5. **Do NOT skip the mapper layers** - persistence uses `snake_case` (`created_at`), entities use `camelCase` (`createdAt`). The domain mapper handles this.
6. **Do NOT put business logic in controllers, persistence, or mappers** - it belongs in entity domain methods or use cases.
7. **Do NOT return raw Mongoose documents** - always map to domain entities.
8. **Do NOT add dependencies that are not used** - the template keeps a minimal dependency footprint.

---

## Appendix A - Removing Example Scaffolding

**Only do this after the new domain is fully implemented and working.** The example files serve as the living reference for how each layer should be built - do not remove them prematurely.

Before proceeding, ask the user for confirmation:

> "The new domain is fully implemented. Would you like me to remove the unused `example` files?"

**Only proceed if the user confirms.** When removing, clean up these files and references:

| What to remove | Location |
|----------------|----------|
| Entity | `domain/entities/example.entity.ts` |
| Props | `domain/props/example-entity.props.ts` |
| Enums | `domain/enums/example.enums.ts` |
| Repository interface | `domain/repositories/example.repository.ts` |
| Domain mapper | `domain/mappers/example.mapper.ts` |
| Inject token | Remove `EXAMPLE_INJECT_TOKEN` from `domain/tokens/inject.token.ts` |
| Domain module binding | Remove example binding from `domain/domain.module.ts` |
| Schema | `infrastructure/database/schemas/example.schema.ts` |
| Persistence | `infrastructure/database/persistence/example.persistence.ts` |
| Database module registration | Remove example schema/persistence from `database.module.ts` |
| Commands | `application/commands/example/` |
| Use cases | `application/use-cases/example/` |
| Application mapper | `application/mappers/example.mapper.ts` |
| Barrel exports | Remove example exports from `export-all.commands.ts`, `export-all.use-cases.ts`, `export-all.dto.ts` |
| Application module | Remove example use cases from `application.module.ts` |
| DTOs | `shared/dtos/example/` |
| Controller | `presentation/controllers/example.controllers.ts` |
| Presentation module | Remove example controller from `presentation.module.ts` |
| Swagger decorator | `infrastructure/documentation/examples/app_documentation/example-swagger.decorator.ts` |
| Swagger tag | Remove example tag from `swagger-tags.config.ts` |
| Route tiers | Remove example routes from `route-tiers.config.ts` |
| E2E tests | Remove example tests from `test/app.e2e-spec.ts` (or the entire file if only example tests) |
| Helper | `common/helpers/functions/example.helper.ts` (if unused) |

**Important:** Before deleting `example.repository.ts`, extract `PaginatedResult<T>` into a shared location (e.g., `domain/repositories/paginated-result.ts`) since other domains depend on it.
