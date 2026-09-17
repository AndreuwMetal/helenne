import { usePageTitle } from '../components/layout/usePageTitle'
import HomeStory from '../components/story/HomeStory'

export default function HomePage() {
  usePageTitle()
  return <HomeStory />
}
