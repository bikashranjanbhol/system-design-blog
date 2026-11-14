import type { Access } from 'payload'

export const isAdmin: Access = ({ req }) => req.user?.collection === 'users'
export const anyone: Access = () => true
