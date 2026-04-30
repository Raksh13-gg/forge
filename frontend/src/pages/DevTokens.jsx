import React from 'react';

export default function DevTokens() {
  return (
    <div className="p-12 space-y-12">
      <h1 className="text-display-hero">Dev Tokens</h1>
      
      <div className="space-y-6">
        <h2 className="text-h2">Card Surface</h2>
        <div className="card w-full max-w-sm">
          <div className="text-label text-tertiary mb-2">TODAY'S SESSION</div>
          <div className="text-display-sm mb-4">React Fundamentals</div>
          <p className="text-body text-secondary">
            Introduction to React, state, and props.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-h2">Buttons</h2>
        <div className="flex gap-4">
          <button className="btn-primary">Primary Action</button>
          <button className="btn-secondary">Secondary Action</button>
          <button className="btn-secondary text-danger-fg border-danger-border">Destructive</button>
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-h2">Input</h2>
        <div className="max-w-sm">
          <label className="block text-label text-secondary mb-2">Email Address</label>
          <input type="email" placeholder="student@forge.local" className="input w-full" />
          <p className="text-caption text-tertiary mt-2">Use your registered email</p>
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-h2">Status Pills</h2>
        <div className="flex gap-4">
          <span className="pill pill-success">PRESENT</span>
          <span className="pill pill-danger">ABSENT</span>
        </div>
      </div>
    </div>
  );
}
