import ContactFormComponent from '@/components/contact/first.component';
import FooterComponent from '@/components/footer/footer';
import Navbar from '@/components/shared/navbar/navbar';
import React from 'react'

const ConctactPage = () => {
  return (
    <div className='w-full h-full bg-white dark:bg-zinc-900'>
      <header className="mb-8 flex w-full cursor-default">
        <Navbar/>
      </header>
      <main className=' pt-15 pb-5 relative w-full h-full flex items-center justify-center'>
        <ContactFormComponent/>
      </main>
      <footer className='w-full h-full'>
        <FooterComponent/>
      </footer>
    </div>
  )
}

export default ConctactPage;
