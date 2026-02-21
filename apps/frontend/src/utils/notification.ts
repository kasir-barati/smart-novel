import { toast } from 'sonner';

export const showApiError = () => {
  toast.error('ERROR', {
    description: 'Something went wrong. Try again later..',
    duration: 5000,
  });
};

export const showSuccess = (message: string) => {
  toast.success('Success', {
    description: message,
    duration: 3000,
  });
};

export const showInfo = (message: string) => {
  toast.info('Info', {
    description: message,
    duration: 3000,
  });
};
