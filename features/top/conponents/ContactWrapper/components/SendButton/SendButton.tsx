type PendingProps = {
  isPending: boolean;
};

const SendButton = ({ isPending }: PendingProps): React.ReactElement => {
  return (
    <div>
      <button type="submit" className="" disabled={isPending}>
        {isPending ? 'ログイン中' : 'サインイン'}
      </button>
    </div>
  );
};

export default SendButton;
