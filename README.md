# Post Designer

A powerful, AI-enhanced platform for creating, editing, and scheduling social media posts.

## 🚀 Features

- **Visualizer**: Real-time content creation and preview.
- **Template Gallery**: Choose from a variety of dynamic templates.
- **AI-Powered**: Generate content and suggestions using advanced AI.
- **Admin Dashboard**: Comprehensive logging and user management.
- **Brand Kits**: Manage logos, colors, and fonts for consistent branding.
- **Video Export**: Create video posts with animations and audio.

## 🛠 Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Database**: Firebase (Firestore)
- **Auth**: Firebase Auth
- **Icons**: Lucide React
- **Logging**: Custom UltraLogger

## 📦 Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd post-designer
    ```

2.  **Install dependencies:**
    ```bash
    cd app
    npm install
    ```

3.  **Environment Setup:**
    Create a `.env.local` file in the `app/` directory with your Firebase configuration keys:
    ```env
    NEXT_PUBLIC_FIREBASE_API_KEY=...
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
    # ... other keys
    ```

4.  **Run the development server:**
    ```bash
    npm run dev
    ```

## 📝 Usage

Visit `http://localhost:3000` to access the application.
Navigate to `/admin` for administrative tools (requires admin privileges).

## 🤝 Contributing

1.  Fork the project
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📄 License

Distributed under the MIT License.
