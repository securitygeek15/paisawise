# Contributing to PaisaWise

Thank you for your interest in contributing to PaisaWise! We welcome community contributions to build a clearer, more accessible, and disciplined personal finance tool.

---

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md).

---

## Core Design Principle

When contributing UI/UX or features, remember our primary guiding principle:

> **Less interface. More clarity.**
>
> - Never add decorative widgets to fill empty space.
> - Strictly follow our neutral monochrome palette (`#FAFAFA`, `#FFFFFF`, `#171717`, `#737373`, `#EAEAEA`, `#F4F4F4`).
> - Reserve colors solely for semantic alerts (e.g. over-budget warnings, transaction polarity).
> - Never use floating-point math for monetary amounts — always use `Decimal` / `Numeric(12, 2)`.

---

## Development Workflow

1. **Fork the repository** on GitHub.
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/<your-username>/paisawise.git
   cd paisawise
   ```
3. **Create a branch** for your feature or bugfix:
   ```bash
   git checkout -b feature/your-feature-name
   ```
4. **Setup Backend**:
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # or .\venv\Scripts\activate on Windows
   pip install -r requirements.txt
   pytest tests/test_api.py
   ```
5. **Setup Frontend**:
   ```bash
   cd frontend
   npm install
   npm run build
   ```
6. **Submit a Pull Request**: Ensure all tests pass before opening a PR. Provide a clear description and screenshots of UI changes.

