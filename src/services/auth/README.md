# Auth services

Reserved for shared auth operations when this feature is implemented.
Future services should import auth from '@/config/firebase'.
customer.ts implements customer sign-up, login, password reset, and own-profile
reading. Sign-up saves only profile fields at users/{uid}; passwords stay in Auth.
Staff authentication and account management remain outside this module.
