import FooterComponent from '@/components/footer/footer'
import Navbar from '@/components/shared/navbar/navbar'
import TermsOfUseComponent from '@/components/termsofuse/compo'
import React from 'react'

const page = () => {
  return (
    <div className='w-full h-full flex flex-col items-center justify-center bg-white dark:bg-zinc-900'>
        <header className="mb-8 flex w-full cursor-default">
        <Navbar />
        </header>
        <main className=' pt-5 relative w-full h-full flex items-center justify-center'>
        <TermsOfUseComponent/>
        </main>
        <footer className='w-full h-full'>
            <FooterComponent/>
        </footer>
     
    </div>
  )
}

export default page
