import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { commentService } from '@/services/comment.service';

export function useComments(taskId: string | null) {
  return useQuery({
    queryKey: ['comments', taskId],
    queryFn: () => commentService.getAll(taskId!).then((r) => r.data.data),
    enabled: !!taskId,
  });
}

export function useAddComment(taskId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: string) =>
      commentService.create(taskId, body).then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comments', taskId] });
    },
    onError: () => toast.error('Failed to add comment'),
  });
}

export function useDeleteComment(taskId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (commentId: string) => commentService.remove(taskId, commentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comments', taskId] });
      toast.success('Comment deleted');
    },
    onError: () => toast.error('Failed to delete comment'),
  });
}
