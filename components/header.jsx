"use client"

import { Show, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs'
import Image from 'next/image'
import Link from 'next/link'
import React, { useState } from 'react'
import { Button } from './ui/button'
import { Authenticated, Unauthenticated } from 'convex/react'
import { BarLoader } from 'react-spinners'
import { useStoreUser } from '@/hooks/use-store-user'
import { Plus } from 'lucide-react'



const Header = () => {
  const { isLoading } = useStoreUser();

const[showUpgradeModal, setShowUpgradeModal]= useState();

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
            <Button variant={"ghost"}size="sm" onClick ={setShowUpgradeModal}>
              Pricing
            </Button>
             
              <Button variant={"ghost"}size="sm" asChild className={"mr-2"}>
                <Link href="/explore">Explore</Link>
            </Button>

            <Authenticated>
            <Button size="sm" asChild className="flex gap-2 mr-4">
              <Link href="/create-event">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Create Event</span>
              </Link>
            </Button>


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

        {isLoading && (<div className='absolute bottom-0 left-0 w-full'>
          <BarLoader width={"100%"} color='#a855f7' />
        </div>)}
      </nav>

      {/* modals */}
    </>
  )
}

export default Header