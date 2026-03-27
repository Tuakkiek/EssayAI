import toast from "react-hot-toast";

export const success = (message, options) => toast.success(message, options);

export const error = (message, options) => toast.error(message, options);

export const loading = (message, options) => toast.loading(message, options);

export const dismiss = (toastId) => toast.dismiss(toastId);
