// import { useState } from "react";
import { Button, Box, Typography } from "@mui/material";
import Modal from "@mui/material/Modal";
import CloseIcon from "@mui/icons-material/Close";

type DeleteProp = {
	title?: string;
	modalIsOpen: boolean;
	onDelete: () => void;
	setModalIsOpen: (modalIsOpen: boolean) => void;
	setSelectModalIsOpen?: (listModal: boolean) => void;
};

const DeleteModal = ({
	title,
	modalIsOpen,
	onDelete,
	setModalIsOpen,
	setSelectModalIsOpen,
}: DeleteProp) => {
	return (
		<>
			<Modal //モーダル
				open={modalIsOpen}
				onClose={() => setModalIsOpen(false)}
				aria-labelledby="modal-modal-text"
				// aria-describedby="modal-modal-description"
			>
				<Box
					sx={{
						position: "absolute",
						display: "flex",
						flexDirection: "column",
						justifyContent: "center",
						alignItems: "center",
						width: "100%",
						height: "100%",
						top: "50%",
						left: "50%",
						transform: "translate(-50%, -50%)",
					}}
				>
					<Box
						sx={{
							bgcolor: "#FFF",
							// maxWidth: 650,
							width: "auto",
							boxShadow: 24,
							boxSizing: "border-box",
							p: 4,
							position: "relative",
						}}
					>
						<CloseIcon
							// 閉じる
							sx={{
								position: "absolute",
								top: "-27px",
								right: 0,
								color: "#FFF",
								cursor: "pointer",
							}}
							onClick={() => setModalIsOpen(false)}
						/>
						<Typography variant="h6" sx={{ textAlign: "center" }}>
							削除しても問題ないですか？
						</Typography>
						<Typography variant="subtitle2" sx={{ textAlign: "center" }}>
							{title && "※削除する場合、todoも消去されます。"}
						</Typography>
						<Box
							sx={{
								width: "280px",
								display: "flex",
								justifyContent: "space-around",
								marginTop: 3,
							}}
						>
							<Button
								variant="contained"
								sx={{ maxWidth: "120px ", width: "100%" }}
								onClick={() => {
									console.log("Delete button clicked"); // コンソールログを追加
									onDelete();
									if (setSelectModalIsOpen) {
										setSelectModalIsOpen(false);
									}
								}}
							>
								OK
							</Button>
							<Button
								variant="contained"
								sx={{ maxWidth: "120px ", width: "100%" }}
								onClick={() => {
									console.log("cancel button clicked"); // コンソールログを追加
									setModalIsOpen(false);
									if (setSelectModalIsOpen) {
										setSelectModalIsOpen(false);
									}
								}}
							>
								キャンセル
							</Button>
						</Box>
					</Box>
				</Box>
			</Modal>
		</>
	);
};

export default DeleteModal;
