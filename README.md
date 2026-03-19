# Revive & Rewear

Full-stack e-commerce platform for buying and selling pre-loved clothing.  
Built as a group project for Advanced Software Engineering (IT 426) at Illinois State University.

## What it does

Three role-specific dashboards — buyer, seller, and administrator — each with distinct access controls and workflows.

**Buyer:** browse catalog, filter and search products, add to cart, checkout, manage payment methods, track orders, process returns and cancellations.

**Seller:** list products with photos and descriptions, manage inventory, track sales.

**Admin:** review and approve all product listings before they go live, manage users and categories.

All users authenticate via 2FA on registration. Role-based access control enforces permissions across the platform.

## Architecture

N-tier layered architecture using the MVC pattern:
- **Presentation Layer** — React frontend with role-specific dashboards
- **Application Layer** — service orchestration (user, product, auth, order management)
- **Service Layer** — core business logic and validation rules
- **Data Layer** — MongoDB with repository pattern

## Stack

React · JavaScript · FastAPI · Python · MongoDB · JWT · 2FA authentication · REST API

## Team

Group project — Advanced Software Engineering (IT 426), Illinois State University.

## License

MIT
