'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useTranslation } from '@/lib/i18n';

interface LockedContent {
    id: string;
    title: string;
    description: string | null;
    content_type: 'link' | 'pdf' | 'telegram';
    content_url: string;
    min_tokens: number;
    slug: string;
}

interface LockedContentManagerProps {
    projectId: number;
}

export default function LockedContentManager({ projectId }: LockedContentManagerProps) {
    const { t } = useTranslation();
    // const supabase = createClient(); // REMOVED
    const [contents, setContents] = useState<LockedContent[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        content_type: 'link' as 'link' | 'pdf' | 'telegram',
        content_url: '',
        min_tokens: ''
    });

    useEffect(() => {
        fetchContents();
    }, [projectId]);

    const fetchContents = async () => {
        setLoading(true);
        const { createClient } = await import('@/utils/supabase/client');
        const supabase = createClient();

        const { data, error } = await supabase
            .from('locked_content')
            .select('*')
            .eq('project_id', projectId)
            .order('created_at', { ascending: false });

        if (!error && data) {
            setContents(data);
        }
        setLoading(false);
    };

    const generateSlug = (title: string) => {
        return title
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Remove accents
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const slug = generateSlug(formData.title);

        const { createClient } = await import('@/utils/supabase/client');
        const supabase = createClient();

        const { error } = await supabase.from('locked_content').insert({
            project_id: projectId,
            title: formData.title,
            description: formData.description || null,
            content_type: formData.content_type,
            content_url: formData.content_url,
            min_tokens: parseFloat(formData.min_tokens),
            slug: slug
        });

        if (error) {
            alert('Error: ' + error.message);
        } else {
            setFormData({ title: '', description: '', content_type: 'link', content_url: '', min_tokens: '' });
            setShowForm(false);
            fetchContents();
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm(t('tokenDetail.community.lockedContentManager.deleteConfirm'))) return;

        const { createClient } = await import('@/utils/supabase/client');
        const supabase = createClient();

        const { error } = await supabase.from('locked_content').delete().eq('id', id);

        if (!error) {
            fetchContents();
        }
    };

    const copyLink = (slug: string) => {
        const url = `${window.location.origin}/access/${slug}`;
        navigator.clipboard.writeText(url);
        alert(t('tokenDetail.community.lockedContentManager.linkCopied'));
    };

    if (loading) return <div className="text-gray-400">{t('common.loading')}</div>;

    return (
        <div className="bg-gray-900 p-6 rounded-xl border border-gray-700">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">{t('tokenDetail.community.lockedContentManager.title')}</h3>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded font-semibold transition-colors"
                >
                    {showForm ? t('tokenDetail.community.lockedContentManager.cancel') : t('tokenDetail.community.lockedContentManager.addContent')}
                </button>
            </div>

            {showForm && (
                <form onSubmit={handleSubmit} className="bg-gray-800 p-6 rounded-lg mb-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">{t('tokenDetail.community.lockedContentManager.form.title')}</label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            required
                            className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white"
                            placeholder={t('tokenDetail.community.lockedContentManager.form.titlePlaceholder')}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">{t('tokenDetail.community.lockedContentManager.form.description')}</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white"
                            rows={2}
                            placeholder={t('tokenDetail.community.lockedContentManager.form.descPlaceholder')}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">{t('tokenDetail.community.lockedContentManager.form.type')}</label>
                        <select
                            value={formData.content_type}
                            onChange={(e) => setFormData({ ...formData, content_type: e.target.value as any })}
                            className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white"
                        >
                            <option value="link">{t('tokenDetail.community.lockedContentManager.form.types.link')}</option>
                            <option value="telegram">{t('tokenDetail.community.lockedContentManager.form.types.telegram')}</option>
                            <option value="pdf">{t('tokenDetail.community.lockedContentManager.form.types.pdf')}</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">{t('tokenDetail.community.lockedContentManager.form.url')}</label>
                        <input
                            type="url"
                            value={formData.content_url}
                            onChange={(e) => setFormData({ ...formData, content_url: e.target.value })}
                            required
                            className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white"
                            placeholder={t('tokenDetail.community.lockedContentManager.form.urlPlaceholder')}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">{t('tokenDetail.community.lockedContentManager.form.minTokens')}</label>
                        <input
                            type="number"
                            step="0.01"
                            value={formData.min_tokens}
                            onChange={(e) => setFormData({ ...formData, min_tokens: e.target.value })}
                            required
                            className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white"
                            placeholder={t('tokenDetail.community.lockedContentManager.form.minTokensPlaceholder')}
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded transition-colors"
                    >
                        {t('tokenDetail.community.lockedContentManager.form.create')}
                    </button>
                </form>
            )}

            {contents.length === 0 ? (
                <p className="text-gray-400 text-center py-8">
                    {t('tokenDetail.community.lockedContentManager.noContent')}
                </p>
            ) : (
                <div className="space-y-4">
                    {contents.map((content) => (
                        <div key={content.id} className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h4 className="font-bold text-white">{content.title}</h4>
                                    {content.description && (
                                        <p className="text-sm text-gray-400 mt-1">{content.description}</p>
                                    )}
                                </div>
                                <button
                                    onClick={() => handleDelete(content.id)}
                                    className="text-red-400 hover:text-red-300 text-sm"
                                >
                                    {t('tokenDetail.community.lockedContentManager.delete')}
                                </button>
                            </div>
                            <div className="flex gap-4 text-xs text-gray-500 mb-3">
                                <span>{t('tokenDetail.community.lockedContentManager.typeLabel').replace('{type}', content.content_type)}</span>
                                <span>{t('tokenDetail.community.lockedContentManager.minLabel').replace('{amount}', content.min_tokens.toLocaleString())}</span>
                            </div>
                            <button
                                onClick={() => copyLink(content.slug)}
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold py-2 px-4 rounded transition-colors"
                            >
                                {t('tokenDetail.community.lockedContentManager.copyLink')}
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
