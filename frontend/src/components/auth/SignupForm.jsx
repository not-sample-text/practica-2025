import React, { useState } from "react";
import Input from "../ui/Input";
import Button from "../ui/Button";
import { validateSignupForm } from "../../utils/validation";

/**
 * Signup form component - responsible only for signup form UI and validation
 */
const SignupForm = ({ onSubmit, loading = false }) => {
	const [formData, setFormData] = useState({
		username: "",
		password: "",
		passwordConfirm: ""
	});
	const [errors, setErrors] = useState({});

	const handleInputChange = (field) => (e) => {
		setFormData((prev) => ({
			...prev,
			[field]: e.target.value
		}));

		// Clear error when user starts typing
		if (errors[field]) {
			setErrors((prev) => ({
				...prev,
				[field]: ""
			}));
		}
	};

	const handleSubmit = (e) => {
		e.preventDefault();

		const validation = validateSignupForm(
			formData.username,
			formData.password,
			formData.passwordConfirm
		);

		if (!validation.isValid) {
			setErrors(validation.errors);
			return;
		}

		onSubmit({
			username: formData.username,
			password: formData.password,
			password_confirm: formData.passwordConfirm
		});
	};

	return (
		<form
			onSubmit={handleSubmit}
			className="space-y-4">
			<Input
				label="Nume"
				type="text"
				placeholder="Nume"
				value={formData.username}
				onChange={handleInputChange("username")}
				error={errors.username}
				required
			/>

			<Input
				label="Parolă"
				type="password"
				placeholder="Parola"
				value={formData.password}
				onChange={handleInputChange("password")}
				error={errors.password}
				required
			/>

			<Input
				label="Confirmă Parola"
				type="password"
				placeholder="Confirmă Parola"
				value={formData.passwordConfirm}
				onChange={handleInputChange("passwordConfirm")}
				error={errors.passwordConfirm}
				required
			/>

			<Button
				type="submit"
				variant="primary"
				size="medium"
				disabled={loading}
				className="w-full">
				{loading ? "Se înregistrează..." : "Înregistrează-te"}
			</Button>
		</form>
	);
};

export default SignupForm;
