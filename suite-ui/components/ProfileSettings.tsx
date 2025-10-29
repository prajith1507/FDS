'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { X, User as UserIcon, Mail, Shield, Save, LogOut } from 'lucide-react'

interface ProfileSettingsProps {
  onClose: () => void
}

export default function ProfileSettings({ onClose }: ProfileSettingsProps) {
  const { user, updateProfile, logout } = useAuth()
  const [name, setName] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    setSaveSuccess(false)

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500))

    updateProfile({ name, email })
    
    setIsSaving(false)
    setSaveSuccess(true)

    // Hide success message after 3 seconds
    setTimeout(() => setSaveSuccess(false), 3000)
  }

  const handleLogout = () => {
    logout()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-black text-white p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Profile Settings</h2>
            <p className="text-gray-300 text-sm mt-1">Manage your account information</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {/* Success Message */}
          {saveSuccess && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <Save className="text-white" size={16} />
              </div>
              <div>
                <p className="text-green-800 font-medium">Changes Saved</p>
                <p className="text-green-600 text-sm">Your profile has been updated successfully</p>
              </div>
            </div>
          )}

          {/* Profile Information */}
          <div className="space-y-6">
            {/* Username (Read-only) */}
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserIcon className="text-gray-400" size={20} />
                </div>
                <input
                  type="text"
                  value={user?.username || ''}
                  disabled
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Username cannot be changed</p>
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserIcon className="text-gray-400" size={20} />
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-black"
                  placeholder="Enter your full name"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="text-gray-400" size={20} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-black"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            {/* Role (Read-only) */}
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Role
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Shield className="text-gray-400" size={20} />
                </div>
                <input
                  type="text"
                  value={user?.role?.toUpperCase() || ''}
                  disabled
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed capitalize"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Role is assigned by system administrator</p>
            </div>
          </div>

          {/* Account Information */}
          <div className="mt-8 p-4 bg-gray-100 rounded-lg border border-gray-300">
            <h3 className="text-sm font-semibold text-black mb-3">Account Information</h3>
            <div className="space-y-2 text-sm text-black">
              <div className="flex justify-between">
                <span>Account Type:</span>
                <span className="font-medium">{user?.role === 'admin' ? 'Administrator' : 'User'}</span>
              </div>
              <div className="flex justify-between">
                <span>Status:</span>
                <span className="font-medium text-green-600">Active</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 flex items-center justify-between gap-3">
          <button
            onClick={handleLogout}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-medium text-black flex items-center gap-2"
          >
            <LogOut size={18} />
            Logout
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-medium text-black"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Updating...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Update
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
