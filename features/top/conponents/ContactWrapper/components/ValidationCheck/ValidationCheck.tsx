type ValidationCheckProps = {
  success: boolean;
  message: string;
};

const ValidationCheck = ({
  success,
  message,
}: ValidationCheckProps): React.ReactElement => {
  return (
    <p
      className={`mt-4 flex justify-center ${success === false ? 'text-red-600' : ''}`}
    >
      {success === false && message ? '必須項目を入力して下さい' : message}
    </p>
  );
};

export default ValidationCheck;
