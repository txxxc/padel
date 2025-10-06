'use client'
import { useUser } from '@auth0/nextjs-auth0'
import { useState, useRef, useEffect } from 'react'
import { Button, LinkButton } from './UI'
import Link from 'next/link'

const Profile = () => {
    const { user, isLoading } = useUser()
    const [dropdownOpen, setDropdownOpen] = useState(false)
    const dropdownRef = useRef(null)

    // Close dropdown on outside click
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false)
            }
        }
        if (dropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside)
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [dropdownOpen])

    if (isLoading) {
        return (
            <div className="flex items-center gap-3 bg-gray-900 rounded-lg p-4 shadow mb-2.5 font-bold text-gray-300">
                <span className="animate-pulse">Loading...</span>
            </div>
        )
    }

    return (
        <div className="flex items-center justify-between bg-gray-950 mb-3">
            {/* Logo on the left */}
            <Link href="/">
                <img
                    src="/logo.png"
                    alt="Logo"
                    width="42"
                    height="42"
                    className="w-10 h-10 rounded"
                />
            </Link>

            {/* Right side: login or user info */}
            {!user ? (
                <LinkButton
                    href="/auth/login"
                >
                    Sign in
                </LinkButton>
            ) : (
                <div className="relative" ref={dropdownRef}>
                    <Button
                        onClick={() => setDropdownOpen((open) => !open)}
                        className="flex items-center gap-2 pl-0 pr-3 bg-gray-800 hover:bg-gray-700"
                    >
                        <img
                            alt={user.name || '<>'}
                            width="38"
                            height="38"
                            className="rounded-full w-9 h-9 block mr-1 bg-orange-500 ml-[1px]"
                            src={user.picture}
                        />
                        <span className="font-semibold hidden sm:inline">
                            {user.name?.includes('@') ? user.name.split('@')[0] : user.name}
                        </span>
                        <svg
                            className="w-4 h-4 ml-1"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                    </Button>
                    {dropdownOpen && (
                        <div className="absolute right-0 mt-2 w-40 bg-gray-900 rounded shadow-lg z-10">
                            <a
                                href="/auth/logout"
                                className="block px-4 py-2 text-sm text-gray-200 hover:bg-rose-600 hover:text-white rounded"
                            >
                                Log out
                            </a>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

export { Profile }