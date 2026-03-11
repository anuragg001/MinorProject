"use client"
import { Show, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs'
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
import { Button } from './ui/button'
import { Authenticated, Unauthenticated } from 'convex/react'
import { BarLoader } from 'react-spinners'
import { useStoreUser } from '@/hooks/use-store-user'


const Header = () => {
  const { isLoading } = useStoreUser();

  return (
    <>
      <nav className='fixed top-0 right-0 left-0 bg-background/80 backdrop-blur-xl z-20 border-b'>
        <div className='max-w-7xl mx-auto px-6 py-4 flex items-center justify-between'>
          {/* logo */}
          <Link href={"/"}
            className='flex items-center gap-2'>
            <Image src="/logo3.png" alt='Logo' width={500} height={500} className='w-full h-11' priority />
            {/* pro badge */}
          </Link>


          {/* Search &location -large view */}

          {/* right side action  */}
          <div className='flex items-center'>
            <Authenticated>
              {/* create Event  */}

              <UserButton />
            </Authenticated>
            <Unauthenticated>
              <SignInButton mode='modal'>
                <Button size='sm'>Sign In</Button>
              </SignInButton>
            </Unauthenticated>
          </div>
        </div>

        {/* mobile view search and location */}

        {isLoading && (<div className='absoulte bottom-0 left-0 w-full'>
          <BarLoader width={"100%"} color='#a855f7' />
        </div>)}
      </nav>

      {/* modals */}
    </>
  )
}

export default Header