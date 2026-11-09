# DDD Template with NestJS

<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

A comprehensive Domain-Driven Design (DDD) template built with NestJS, TypeScript, and MongoDB. This template provides a solid foundation for building scalable and maintainable applications following DDD principles.

## 🏗️ Architecture Overview

This template implements a clean architecture following DDD principles with clear separation of concerns:

```
├── 📁 src/
│   ├── 📁 domain/          # Business logic and entities
│   ├── 📁 application/     # Use cases and application services
│   ├── 📁 infrastructure/  # External concerns (database, API, etc.)
│   ├── 📁 presentation/    # Controllers and HTTP layer
│   ├── 📁 common/         # Shared utilities and configurations
│   └── 📁 shared/         # DTOs and interfaces
```

### 🎯 Domain Layer
- **Entities**: Core business objects with identity ([`ExampleEntity`](application/src/domain/entities/example.entity.ts))
- **Repositories**: Interfaces for data persistence ([`ExampleRepository`](application/src/domain/repositories/example.repository.ts))
- **Enums**: Domain-specific value objects ([`Status`](application/src/domain/enums/example.enums.ts))
- **Mappers**: Transform data between layers ([`DomainExampleMapper`](application/src/domain/mappers/example.mapper.ts))

### 🚀 Application Layer
- **Use Cases**: Business logic implementation ([`CreateExampleUseCase`](application/src/application/use-cases/example/create-example.use-case.ts))
- **Commands**: Input data structures for operations ([`CreateExampleCommand`](application/src/application/commands/example/create-example.command.ts))
- **Mappers**: Transform DTOs to commands/entities ([`ApplicationExampleMapper`](application/src/application/mappers/example.mapper.ts))

### 🔧 Infrastructure Layer
- **Database**: MongoDB schemas and persistence ([`ExampleSchema`](application/src/infrastructure/database/schemas/example.schema.ts), [`ExamplePersistence`](application/src/infrastructure/database/persistence/example.persistence.ts))
- **Authentication**: JWT and Bearer token guards ([`AuthGuard`](application/src/infrastructure/auth/auth.guard.ts))
- **Documentation**: Swagger configuration and decorators
- **Health**: Application health checks ([`HealthController`](application/src/infrastructure/health/controllers/health.controller.ts))

### 🎨 Presentation Layer
- **Controllers**: HTTP endpoints and routing ([`ExampleController`](application/src/presentation/controllers/example.controllers.ts))
- **DTOs**: Data transfer objects for API communication

## 📚 API Documentation

Access Swagger documentation at: `http://localhost:3000/api-docs`

**Authentication required:**
- Username: Set in `SWAGGER_AUTH_USERNAME`
- Password: Set in `SWAGGER_AUTH_PASSWORD`

## 🔐 Authentication

The template uses Bearer token authentication via [`AuthGuard`](application/src/infrastructure/auth/auth.guard.ts).

**To make authenticated requests:**
```bash
curl -H "Authorization: Bearer <your-token>" http://localhost:3000/example
```

---

**Happy coding! 🚀**

For questions or support, please refer to the team documentation or create an issue.