import { Component } from "react";

/**
 * Catch rendering errors and show a reload prompt.
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  handleReload = () => {
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
          <div className="w-full max-w-md rounded-[24px] bg-white p-6 text-center shadow-lg">
            <h1 className="text-2xl font-extrabold text-gray-900">Đã xảy ra lỗi</h1>
            <p className="mt-2 text-sm text-gray-600" role="alert">
              Vui lòng tải lại trang.
            </p>
            <button
              type="button"
              onClick={this.handleReload}
              className="mt-4 w-full rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-primaryDark"
            >
              Tải lại
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
