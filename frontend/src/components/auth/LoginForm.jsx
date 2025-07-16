import React, { useState } from "react";
import Input from "../ui/Input";
import Button from "../ui/Button";
import { validateLoginForm } from "../../utils/validation";

/**
 * Login form component - responsible only for login form UI and validation
 */
const LoginForm = ({ onSubmit, loading = false }) => {
	const [formData, setFormData] = useState({
		username: "",
		password: ""
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

		const validation = validateLoginForm(formData.username, formData.password);

		if (!validation.isValid) {
			setErrors(validation.errors);
			return;
		}

		onSubmit(formData);
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

			<Button
				type="submit"
				variant="primary"
				size="medium"
				disabled={loading}
				className="w-full">
				{loading ? "Se conectează..." : "Conectare"}
			</Button>
		</form>
	);
};

export default LoginForm;
