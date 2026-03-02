import { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const path = window.location.pathname;

  if (path === "/login") {
    return <LoginPage />;
  }

  if (path === "/register") {
    return <RegisterPage />;
  }

  if (path === "/change-password") {
    return <ChangePasswordPage />;
  }

  // Trang xác thực email (root với token)
  return <VerifyEmailPage />;
}

// Trang xác thực email
function VerifyEmailPage() {
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");

    if (!token) {
      // Không có token, chuyển về login
      window.location.href = "/login";
      return;
    }

    verifyEmail(token);
  }, []);

  const verifyEmail = async (token) => {
    try {
      await axios.post("/api/auth/verify-email", {
        token: token,
      });

      setStatus("success");
      setMessage("Xác thực email thành công!");

      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
    } catch (error) {
      setStatus("error");
      setMessage(error.response?.data?.error || "Xác thực email thất bại");
    }
  };

  return (
    <div className="container">
      <div className="card">
        {status === "loading" && (
          <>
            <div className="spinner"></div>
            <h1>Đang xác thực email...</h1>
          </>
        )}

        {status === "success" && (
          <>
            <div className="success-icon">✓</div>
            <h1>Thành công!</h1>
            <p>{message}</p>
            <p className="redirect-msg">
              Đang chuyển hướng về trang đăng nhập...
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <div className="error-icon">✗</div>
            <h1>Thất bại!</h1>
            <p>{message}</p>
            <a href="/login" className="btn">
              Quay lại đăng nhập
            </a>
          </>
        )}
      </div>
    </div>
  );
}

// Trang đăng nhập
function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showResendButton, setShowResendButton] = useState(false);
  const [resendStatus, setResendStatus] = useState("");

  // Kiểm tra xem user đã đăng nhập nhưng chưa xác thực email
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const userStr = localStorage.getItem("user");

    // Nếu đã đăng nhập (có token), chuyển đến trang đổi mật khẩu
    if (token) {
      window.location.href = "/change-password";
      return;
    }

    if (userStr) {
      const user = JSON.parse(userStr);
      // Nếu user đã đăng nhập nhưng chưa verified
      if (user && !user.verified_at) {
        setShowResendButton(true);
      }
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await axios.post("/api/auth/login", {
        email,
        password,
      });

      localStorage.setItem("access_token", response.data.access_token);
      localStorage.setItem("refresh_token", response.data.refresh_token);
      localStorage.setItem("user", JSON.stringify(response.data.user));

      // Kiểm tra nếu email chưa được xác thực
      if (response.data.user && !response.data.user.verified_at) {
        setShowResendButton(true);
        setError(
          "Email chưa được xác thực. Vui lòng xác thực email để sử dụng đầy đủ tính năng.",
        );
      } else {
        // Đăng nhập thành công - chuyển đến trang change-password
        window.location.href = "/change-password";
      }
    } catch (err) {
      setError(err.response?.data?.error || "Đăng nhập thất bại");
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    const token = localStorage.getItem("access_token");

    // Kiểm tra nếu chưa đăng nhập
    if (!token) {
      setError("Bạn cần đăng nhập để gửi lại email xác thực");
      return;
    }

    setResendStatus("sending");
    setError("");
    try {
      await axios.post(
        "/api/auth/resend-verify-email",
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      setResendStatus("success");
    } catch (err) {
      setResendStatus("error");
      setError(err.response?.data?.error || "Gửi email thất bại");
    }
  };

  return (
    <div className="container">
      <div className="card">
        <h1>Đăng nhập</h1>

        {error && <div className="error-message">{error}</div>}

        {showResendButton && resendStatus === "success" && (
          <div className="success-message">
            Đã gửi email xác thực! Vui lòng kiểm tra hộp thư của bạn.
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Nhập email của bạn"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Mật khẩu</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Nhập mật khẩu"
            />
          </div>

          <button type="submit" className="btn btn-full" disabled={loading}>
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
        </form>

        {/* Nút gửi lại email xác thực - hiển thị luôn trên trang login */}
        <div className="resend-section">
          <p className="resend-label">Chưa nhận được email xác thực?</p>
          <button
            type="button"
            className="btn btn-outline"
            onClick={handleResendEmail}
            disabled={resendStatus === "sending"}
          >
            {resendStatus === "sending"
              ? "Đang gửi..."
              : "Gửi lại email xác thực"}
          </button>
        </div>

        <div className="links">
          <p>
            Chưa có tài khoản? <a href="/register">Đăng ký</a>
          </p>
        </div>
      </div>
    </div>
  );
}

// Trang đăng ký
function RegisterPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validate passwords match
    if (password !== confirmPassword) {
      setError("Mật khẩu không khớp");
      return;
    }

    // Validate password length
    if (password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }

    setLoading(true);

    try {
      await axios.post("/api/auth/register", {
        username,
        email,
        password,
      });

      // Đăng ký thành công - hiển thị thông báo
      setSuccess(
        "Đăng ký thành công! Tôi đã gửi cho bạn email xác thực. Vui lòng kiểm tra hộp thư để xác thực email.",
      );

      // Clear form
      setUsername("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");

      // Chuyển về login sau 3 giây
    } catch (err) {
      setError(err.response?.data?.error || "Đăng ký thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="card">
        <h1>Đăng ký</h1>

        {error && <div className="error-message">{error}</div>}

        {success && <div className="success-message">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Tên đăng nhập</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="Nhập tên đăng nhập"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Nhập email của bạn"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Mật khẩu</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Nhập mật khẩu (ít nhất 6 ký tự)"
              minLength={6}
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Xác nhận mật khẩu</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="Nhập lại mật khẩu"
            />
          </div>

          <button type="submit" className="btn btn-full" disabled={loading}>
            {loading ? "Đang đăng ký..." : "Đăng ký"}
          </button>
        </form>

        <div className="links">
          <p>
            Đã có tài khoản? <a href="/login">Đăng nhập</a>
          </p>
        </div>
      </div>
    </div>
  );
}

// Trang đổi mật khẩu
function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // Kiểm tra đăng nhập khi mount
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      // Chưa đăng nhập, chuyển về login
      window.location.href = "/login";
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validate new password matches confirm
    if (newPassword !== confirmPassword) {
      setError("Mật khẩu mới và xác nhận mật khẩu không khớp");
      return;
    }

    // Validate password length
    if (newPassword.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }

    // Validate new password is different from current
    if (currentPassword === newPassword) {
      setError("Mật khẩu mới phải khác mật khẩu hiện tại");
      return;
    }

    setLoading(true);

    const token = localStorage.getItem("access_token");

    try {
      await axios.post(
        "/api/auth/change-password",
        {
          currentPassword,
          newPassword,
          confirmPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setSuccess("Đổi mật khẩu thành công!");

      // Clear form
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      // Chuyển về trang chủ sau 2 giây
      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || "Đổi mật khẩu thất bại");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  return (
    <div className="container">
      <div className="card">
        <h1>Đổi mật khẩu</h1>

        {error && <div className="error-message">{error}</div>}

        {success && <div className="success-message">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="currentPassword">Mật khẩu hiện tại</label>
            <input
              type="password"
              id="currentPassword"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              placeholder="Nhập mật khẩu hiện tại"
            />
          </div>

          <div className="form-group">
            <label htmlFor="newPassword">Mật khẩu mới</label>
            <input
              type="password"
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              placeholder="Nhập mật khẩu mới (ít nhất 6 ký tự)"
              minLength={6}
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmNewPassword">Xác nhận mật khẩu mới</label>
            <input
              type="password"
              id="confirmNewPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="Nhập lại mật khẩu mới"
            />
          </div>

          <button type="submit" className="btn btn-full" disabled={loading}>
            {loading ? "Đang đổi mật khẩu..." : "Đổi mật khẩu"}
          </button>
        </form>

        <div className="links">
          <p>
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                handleLogout();
              }}
            >
              Đăng xuất
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
