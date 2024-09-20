import React from "react";
import Button from "../../../components/forms/Button";
import { useNavigate } from "react-router-dom";

function NotFound() {
  const navigate = useNavigate();
  const handleClick = () => navigate("/", { replace: true });

  return (
    <main className="flex items-center min-h-screen container mx-auto lg:max-w-6xl">
      <section className="flex flex-col w-[40.5rem] gap-y-2">
        <h1 className="font-archivo leading-110 tracking-tightest text-4xl">
          404
        </h1>
        <p className="font-satoshi font-normal leading-150 tracking-tightest text-large">
          The page you are looking is removed, not working or temporarily
          unavailable.
        </p>
        <Button
          type="button"
          className="md:w-fit px-8 md:px-16 font-bold leading-100"
          onClick={handleClick}
        >
          Go Back To HomePage
        </Button>
      </section>
    </main>
  );
}

export default NotFound;
