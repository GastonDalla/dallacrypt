# 🔐 DallaCrypt

## Military-grade encryption for your sensitive data - 100% local

DallaCrypt is a secure encryption application that uses AES-256 algorithms with PBKDF2 key derivation to protect your messages, files, and confidential data. Designed with a privacy-centered approach, all encryption occurs locally in your browser.

## 🚀 Technologies

The project is built with modern and powerful technologies:

- **[Next.js 15](https://nextjs.org/)**
- **[React 19](https://react.dev/)**
- **[Tailwind CSS v4](https://tailwindcss.com/)**
- **[Shadcn/ui](https://ui.shadcn.com/)**
- **[TanStack Table](https://tanstack.com/table/latest)**

## 🔨 Installation and Development

### Prerequisites

- [Node.js](https://nodejs.org/) (v18.17.0 or higher)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/) or [pnpm](https://pnpm.io/)

### Installation Steps

1. **Clone the repository**

```bash
git clone https://github.com/gastondalla/dallacrypt.git
cd dallacrypt
```

2. **Install dependencies**

```bash
npm install
# or
yarn install
# or
pnpm install
```

3. **Start development environment**

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

The application will be available at `http://localhost:3000`

4. **Build for production**

```bash
npm run build
# or
yarn build
# or
pnpm build
```

5. **Start production version**

```bash
npm run start
# or
yarn start
# or
pnpm start
```

## 🔒 Main Features

- **AES-256 encryption** with PBKDF2 key derivation
- **High security mode** with 10x more iterations for increased protection
- **File encryption** with support for multiple formats
- **Share encrypted content** via links, files, or QR codes
- **Local history** to access previous encrypted/decrypted messages
- **Modern and responsive interface** with light/dark theme support
- **Zero-knowledge**: all encryption happens locally, data is never sent to servers
- **100% private**: no tracking, cookies, or cloud storage

## 📊 Password Strength Indicator

DallaCrypt includes a visual strength meter that analyzes keys based on:

- Length (minimum 8 characters)
- Combination of uppercase and lowercase letters
- Inclusion of numbers
- Inclusion of special characters

## 🛡️ Security

The application uses modern cryptography techniques:

- **AES-256 algorithm** in CBC mode for encryption
- **PBKDF2 key derivation** with random salt for protection against brute force attacks
- **Integrity verification** to detect message tampering
- **High security mode** for extremely sensitive information

## 🌐 Use Cases

- Protect passwords and sensitive credentials
- Send confidential messages securely
- Store personal information in encrypted form
- Protect important documents and files
- Share confidential data with clients or collaborators

## 🤝 Contributing

Contributions are welcome. For major changes, please open an issue first to discuss what you would like to change.

## 📜 License

[MIT](LICENSE)

---

Developed by [Gaston Dalla](https://github.com/GastonDalla) - Focused on security and privacy 🔒 