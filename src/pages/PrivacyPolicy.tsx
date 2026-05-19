import React from "react";
import { Helmet } from "react-helmet-async";

const PrivacyPolicy: React.FC = () => (
  <>
    <Helmet>
      <title>Privacy Policy | Track Hub</title>
      <meta name="description" content="Learn how Track Hub collects, uses, and protects your information." />
    </Helmet>
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-4">Privacy Policy</h1>
      <p className="mb-4">
        Your privacy is important to us. This Privacy Policy explains how TrackerHub (the “Site”, “we”, “us”, or “our”) collects, uses, and shares your personal information when you use our services.
      </p>
      <h2 className="text-xl font-semibold mt-4 mb-2">Information We Collect</h2>
      <ul className="list-disc list-inside mb-4">
        <li>Account data such as your name and email address when you sign up.</li>
        <li>Usage data about how you interact with our services.</li>
        <li>Device and browser data to improve our service.</li>
      </ul>
      <h2 className="text-xl font-semibold mt-4 mb-2">How We Use Information</h2>
      <ul className="list-disc list-inside mb-4">
        <li>To provide and operate our services.</li>
        <li>For analytics and service improvement.</li>
        <li>To communicate with you about updates or issues.</li>
      </ul>
      <h2 className="text-xl font-semibold mt-4 mb-2">Your Rights</h2>
      <ul className="list-disc list-inside mb-4">
        <li>Request a copy or deletion of your personal data.</li>
        <li>Update your information from your account settings.</li>
        <li>Contact us for privacy questions.</li>
      </ul>
      <p>
        We do not sell your data. For any questions, contact us at: support@trackerhub.com.
      </p>
    </div>
  </>
);

export default PrivacyPolicy;
