import { notFound } from 'next/navigation';
import AccessContent from './AccessContent';
import { createClient } from '@/utils/supabase/server';

export default async function AccessPage({ params }: { params: { slug: string } }) {
    const supabase = createClient();

    const { data: content, error } = await supabase
        .from('locked_content')
        .select(`
            *,
            projects (
                contract_address,
                chain_id,
                name,
                ticker,
                logo_url
            )
        `)
        .eq('slug', params.slug)
        .single();

    if (error || !content) {
        notFound();
    }

    return <AccessContent content={content} />;
}
