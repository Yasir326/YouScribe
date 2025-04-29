# YouLearnNow 📺✍️

<!-- <p align="center">
  <img src="assets/YouLearnNow-logo.png" alt="YouLearnNow Logo" width="200"/>
</p> -->

YouLearnNow is a powerful tool that transforms YouTube videos into actionable insights and comprehensive summaries. Whether you're a busy professional, a student, or just someone who loves to learn efficiently, YouLearnNow is your go-to solution for extracting valuable information from video content.

## 🚀 Features

- **Video Summarization**: Get concise summaries of YouTube videos.
- **Action Steps**: For educational or business-related content, receive actionable steps to implement the advice.
- **Comprehensive Summaries**: For other types of content, get detailed summaries that capture the essence of the video.
- **User-Friendly Interface**: Easy-to-use web application for seamless interaction.
- **Secure Authentication**: Powered by Kinde for robust and secure user management.
- **Flexible Pricing**: Various subscription plans to suit different needs, with secure payment processing via Stripe.

## 🛠️ Tech Stack

- **Backend**: Next.js API Routes
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: Kinde SSO
- **Payment Processing**: Stripe
- **Frontend**: Next.js (React framework)
- **UI Components**: shadcn/ui
- **API Documentation**: Swagger

## 🏗️ Architecture

YouLearnNow follows a monolithic architecture with modular components:

- **Auth Module**: Integrates with Kinde for user registration, login, and token management.
- **Transcript Module**: Fetches and processes YouTube video transcripts.
- **Summary Module**: Generates summaries and action steps from transcripts using AI.
- **Payment Module**: Integrates with Stripe to manage subscriptions and process payments.
- **User Module**: Handles user-related operations and data management.

## 🚦 Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL
- Kinde account
- Stripe account
- OpenAI API key

### Installation

1. Clone the repository:

   ```
   git clone https://github.com/yourusername/YouLearnNow.git
   ```

2. Navigate to the project directory:

   ```
   cd YouLearnNow
   ```

3. Install dependencies:

   ```
   npm install
   ```

4. Set up environment variables:

   - Copy `.env.example` to `.env.local`
   - Fill in the required values in `.env.local`

5. Set up the database and run migrations:

   ```
   npx prisma migrate dev
   ```

6. Start the development server:
   ```
   npm run dev
   ```

## 🧪 Running Tests

To run the test suite:

```
go test ./...
```

## 📚 API Documentation

[Link to your API documentation, or include basic endpoint information here]

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for more details.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👏 Acknowledgements

## 📞 Contact

For any queries or support, please contact us at [yasirk2190@gmail.com](mailto:yasirk2190@gmail.com).

---

Made with ❤️ by [Yasir](https://www.linkedin.com/in/yasir-khan-64547465/)
