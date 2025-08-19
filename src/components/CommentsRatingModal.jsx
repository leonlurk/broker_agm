import React, { useState } from 'react';
import { X, Star, MessageSquare, Send } from 'lucide-react';
import useTranslation from '../hooks/useTranslation';

const CommentsRatingModal = ({ isOpen, onClose, trader, onSubmit }) => {
  const { t } = useTranslation();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleStarClick = (value) => {
    setRating(value);
  };

  const handleStarHover = (value) => {
    setHoveredRating(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      alert(t('comments.pleaseSelectRating'));
      return;
    }
    if (comment.trim().length < 10) {
      alert(t('comments.commentTooShort'));
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        rating,
        comment: comment.trim(),
        traderId: trader?.id,
        traderName: trader?.name
      });
      
      // Reset form
      setRating(0);
      setComment('');
      setHoveredRating(0);
      onClose();
    } catch (error) {
      console.error('Error submitting comment:', error);
      alert(t('comments.submitError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStar = (value) => {
    const isFilled = value <= (hoveredRating || rating);
    return (
      <button
        key={value}
        type="button"
        onClick={() => handleStarClick(value)}
        onMouseEnter={() => handleStarHover(value)}
        onMouseLeave={() => setHoveredRating(0)}
        className="transition-colors duration-150 hover:scale-110 transform"
      >
        <Star
          size={32}
          className={`${
            isFilled
              ? 'text-yellow-400 fill-current'
              : 'text-gray-400 hover:text-yellow-300'
          }`}
        />
      </button>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#232323] rounded-2xl border border-[#333] w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#333]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500 bg-opacity-20 rounded-lg">
              <MessageSquare className="text-yellow-500" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">{t('comments.commentTrader')}</h2>
              <p className="text-sm text-gray-400">{t('comments.shareExperience')} {trader?.name || t('comments.thisTrader')}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#333] rounded-lg transition-colors"
          >
            <X className="text-gray-400" size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Rating Section */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-300">
              {t('comments.rating')}
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((value) => renderStar(value))}
            </div>
            <div className="text-sm text-gray-400">
              {rating === 0 && t('comments.selectRating')}
              {rating === 1 && t('comments.veryBad')}
              {rating === 2 && t('comments.bad')}
              {rating === 3 && t('comments.regular')}
              {rating === 4 && t('comments.good')}
              {rating === 5 && t('comments.excellent')}
            </div>
          </div>

          {/* Comment Section */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-300">
              {t('comments.comment')}
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={t('comments.commentPlaceholder')}
              className="w-full px-4 py-3 bg-[#2a2a2a] border border-[#333] rounded-lg text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none resize-none"
              rows={4}
              maxLength={500}
            />
            <div className="flex justify-between text-xs text-gray-400">
              <span>{t('comments.minCharacters')}</span>
              <span>{comment.length}/500</span>
            </div>
          </div>

          {/* Guidelines */}
          <div className="bg-[#2a2a2a] p-4 rounded-lg border border-[#333]">
            <h4 className="text-sm font-medium text-gray-300 mb-2">{t('comments.guidelines')}</h4>
            <ul className="text-xs text-gray-400 space-y-1">
              <li>• {t('comments.guideline1')}</li>
              <li>• {t('comments.guideline2')}</li>
              <li>• {t('comments.guideline3')}</li>
              <li>• {t('comments.guideline4')}</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-[#333] hover:bg-[#444] text-white rounded-lg transition-colors"
              disabled={isSubmitting}
            >
              {t('comments.cancel')}
            </button>
            <button
              type="submit"
              disabled={rating === 0 || comment.trim().length < 10 || isSubmitting}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  {t('comments.sending')}
                </>
              ) : (
                <>
                  <Send size={16} />
                  {t('comments.submitComment')}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CommentsRatingModal;