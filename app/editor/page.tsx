import type {Metadata} from 'next';
import MediaEditor from '@/components/MediaEditor';
export const metadata:Metadata={title:'Media Editor — Kryptex Studio',description:'Upload and edit photos or videos in Kryptex Studio.'};
export default function EditorPage(){return <MediaEditor/>}
