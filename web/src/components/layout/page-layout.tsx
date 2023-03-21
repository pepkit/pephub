import { FC } from "react"
import { Nav } from "./nav"
import { SEO } from "./seo"

interface Props {
    children: React.ReactNode
    title?: string
    description?: string
    image?: string
}

export const PageLayout: FC<Props> = ({ children, title, description, image }) => {
    return (
        <>
          <SEO 
            title={title}
            description={description}
            image={image}
          />
          <header><Nav /></header>
          <main className="container">
            {children}
          </main>
        </>
    )
}
