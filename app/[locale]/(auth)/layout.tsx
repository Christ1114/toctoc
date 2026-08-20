import React from 'react'

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="w-full h- flex items-center justify-center bg-white dark:bg-neutral-900 ">
      {children}
    </div>
  )
}

export default Layout