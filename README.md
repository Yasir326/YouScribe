# Youscribe 📺✍️

<!-- <p align="center">
  <img src="assets/youscribe-logo.png" alt="Youscribe Logo" width="200"/>
</p> -->

Youscribe is a powerful tool that transforms YouTube videos into actionable insights and comprehensive summaries. Whether you're a busy professional, a student, or just someone who loves to learn efficiently, Youscribe is your go-to solution for extracting valuable information from video content.

## 🚀 Features

- **Video Summarization**: Get concise summaries of YouTube videos.
- **Action Steps**: For educational or business-related content, receive actionable steps to implement the advice.
- **Comprehensive Summaries**: For other types of content, get detailed summaries that capture the essence of the video.
- **User-Friendly Interface**: Easy-to-use web application for seamless interaction.
- **Secure Authentication**: Powered by Kinde for robust and secure user management.
- **Flexible Pricing**: Various subscription plans to suit different needs, with secure payment processing via Stripe.

## 🛠️ Tech Stack

- **Backend**: Go (Gin framework)
- **Database**: MongoDB
- **Authentication**: Kinde SSO
- **Payment Processing**: Stripe
- **Frontend**: [Your frontend technology, e.g., React, Vue.js]

## 🏗️ Architecture

Youscribe follows a microservices architecture:

- **Auth Service**: Handles user registration, login, and token management.
- **Transcript Service**: Fetches and processes YouTube video transcripts.
- **Summary Service**: Generates summaries and action steps from transcripts.
- **Payment Service**: Manages subscriptions and processes payments.

## 🚦 Getting Started

### Prerequisites

- Go 1.16+
- MongoDB
- Node.js and npm (for frontend)
- Kinde account
- Stripe account

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/youscribe.git
   ```

2. Navigate to the project directory:
   ```
   cd youscribe
   ```

3. Install backend dependencies:
   ```
   go mod tidy
   ```

4. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Fill in the required values in `.env`

5. Start the backend server:
   ```
   go run cmd/server/main.go
   ```

6. [Add steps for setting up and running the frontend]

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